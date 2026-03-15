"""
Paypart payment views:

POST /api/payment/initiate/          – Create Paypart invitation + return redirect URL
POST /api/payment/verify/            – Verify payment by redirectionTag (poll check_transaction)
GET  /api/payment/my-books/          – List books purchased by authenticated user
GET  /api/payment/admin-payments/    – All payments (admin only)
POST /api/payment/validate-coupon/   – Validate a coupon code
GET  /api/payment/coupons/           – List coupons (admin)
POST /api/payment/coupons/          – Create coupon (admin)
PATCH/DELETE /api/payment/coupons/<id>/  – Update / delete coupon (admin)
"""
import json
import logging
import string
import random
import base64
import http.client
import urllib.parse

from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions

from .models import Training, Book, Payment, BookPurchase, Enrollment, Coupon, Conversation
from .serializers import BookSerializer, CouponSerializer

logger = logging.getLogger(__name__)

PAYPART_TOKEN = getattr(settings, "PAYPART_TOKEN", "")
PAYPART_HOST  = "api.paypart.dz"
FRONTEND_URL  = getattr(settings, "FRONTEND_URL", "http://localhost:5173")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _gen_tag(length: int = 12) -> str:
    """Generate a unique alphanumeric redirectionTag."""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


def _paypart_create_invitation(product: str, description: str, price: float) -> dict | None:
    """
    Create a Paypart product invitation.
    Returns the response dict or None on error.
    Note: price must be in DZD (1000–5000000). We clamp if needed.
    """
    price_int = max(1000, min(5000000, int(price)))  # clamp to Paypart's range

    # Minimal valid base64 SVG as placeholder image
    placeholder_svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>"
        "<rect width='100' height='100' fill='%234F46E5'/></svg>"
    )
    img_b64 = base64.b64encode(placeholder_svg.encode()).decode()

    payload = json.dumps({
        "product": product[:80],
        "description": description[:255],
        "price": price_int,
        "weightKg": 1,
        "deliveryServices": [],
        "invitationType": "digital-product",
        "image": img_b64,
    })
    headers = {
        "Content-Type": "application/json",
        "Authorization": PAYPART_TOKEN,
    }
    try:
        conn = http.client.HTTPSConnection(PAYPART_HOST, timeout=15)
        conn.request("POST", "/api/seller/api/invitation", payload, headers)
        resp = conn.getresponse()
        body = resp.read().decode("utf-8")
        conn.close()
        data = json.loads(body)
        logger.info("Paypart invitation response: %s", data)
        return data
    except Exception as e:
        logger.error("Paypart invitation error: %s", e)
        return None


def _paypart_check_transaction(redirection_tag: str) -> dict | None:
    """
    Poll Paypart for the current transaction status.
    Returns the response dict or None on error.
    """
    encoded = urllib.parse.urlencode({"redirectionTag": redirection_tag})
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": PAYPART_TOKEN,
    }
    try:
        conn = http.client.HTTPSConnection(PAYPART_HOST, timeout=15)
        conn.request("POST", "/api/seller/api/check_transaction", encoded, headers)
        resp = conn.getresponse()
        body = resp.read().decode("utf-8")
        conn.close()
        data = json.loads(body)
        logger.info("Paypart check_transaction (%s): %s", redirection_tag, data)
        return data
    except Exception as e:
        logger.error("Paypart check_transaction error: %s", e)
        return None


def _build_paypart_url(invitation_uuid: str, redirection_tag: str,
                       buyer_remark: str = "") -> str:
    """Build the full Paypart redirect URL."""
    base = "https://paypart.dz/app/auth"
    success = f"{FRONTEND_URL}/payment/success/{redirection_tag}"
    fail    = f"{FRONTEND_URL}/payment/failed/{redirection_tag}"
    params = {
        "next": "newTransaction",
        "InvitationUuid": invitation_uuid,
        "sellerDelivery": "true",
        "pickFromStore": "true",
        "deliveryWilaya": "16",
        "deliveryCommune": "",
        "deliveryPlace": "",
        "buyerRemark": buyer_remark,
        "successUrl": success,
        "failUrl": fail,
        "redirectionTag": redirection_tag,
    }
    return base + "?" + urllib.parse.urlencode(params)


# ─── Initiate Payment ─────────────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def initiate_payment(request):
    """
    Body: {
      "item_type": "course"|"book"|"conversation",
      "item_id": <int>,
      "wilaya": "16- Alger",
      "commune": "Ben Aknoun",
      "place": "Rue X, Appt Y",
      "buyer_remark": "",       (optional)
      "coupon_code": ""         (optional)
    }
    Returns: { "redirect_url": "https://paypart.dz/..." }
    """
    item_type    = request.data.get("item_type")
    item_id      = request.data.get("item_id")
    wilaya       = request.data.get("wilaya", "").strip()
    commune      = request.data.get("commune", "").strip()
    place        = request.data.get("place", "").strip()
    buyer_remark = request.data.get("buyer_remark", "").strip()

    if item_type not in ("course", "book", "conversation") or not item_id:
        return Response({"error": "item_type et item_id sont requis."}, status=400)

    # Resolve item
    try:
        if item_type == "course":
            item = Training.objects.get(id=item_id)
        elif item_type == "book":
            item = Book.objects.get(id=item_id)
        elif item_type == "conversation":
            item = Conversation.objects.get(id=item_id)
            # Add mock fields for Paypart to use
            item.title = "Abonnement Messagerie Formateur"
            item.description = f"Extension de 30 jours pour la discussion avec le formateur."
            item.price_dzd = 10000.00
            item.discount_percent = 0
    except (Training.DoesNotExist, Book.DoesNotExist, Conversation.DoesNotExist):
        return Response({"error": "Article introuvable."}, status=404)

    amount = float(item.price_dzd)
    item_discount = item.discount_percent or 0
    if item_discount > 0:
        amount = round(amount * (1 - item_discount / 100), 2)

    # Apply coupon
    coupon = None
    coupon_code = request.data.get("coupon_code", "").strip().upper()
    if coupon_code:
        try:
            coupon = Coupon.objects.get(code=coupon_code)
            valid, reason = coupon.is_valid(item_type)
            if not valid:
                return Response({"error": reason}, status=400)
            amount = round(amount * (1 - coupon.discount_percent / 100), 2)
        except Coupon.DoesNotExist:
            return Response({"error": "Code coupon invalide."}, status=400)

    amount = max(amount, 1000.0)  # Paypart minimum 1000 DZD

    # Create Paypart invitation
    inv_result = _paypart_create_invitation(item.title, getattr(item, 'description', item.title), amount)
    
    # Paypart API returns 'invitation' or 'Invitation'
    inv_key = "invitation" if "invitation" in (inv_result or {}) else "Invitation"

    if not inv_result or inv_key not in inv_result:
        logger.error("Paypart invitation failed: %s", inv_result)
        error_msg = inv_result.get("message", "Impossible de créer le paiement. Veuillez réessayer.") if isinstance(inv_result, dict) else "Erreur de connexion avec Paypart."
        return Response({"error": f"Erreur Paypart: {error_msg}"}, status=400)

    invitation_uuid = inv_result[inv_key]["uuid"]

    # Generate unique redirectionTag
    tag = _gen_tag(12)
    while Payment.objects.filter(redirection_tag=tag).exists():
        tag = _gen_tag(12)

    # Save Payment record
    Payment.objects.create(
        user=request.user,
        item_type=item_type,
        item_id=item_id,
        paypart_invitation_uuid=invitation_uuid,
        redirection_tag=tag,
        amount=amount,
        delivery_wilaya=wilaya,
        delivery_commune=commune,
        delivery_place=place,
    )

    # Increment coupon usage
    if coupon:
        coupon.used_count += 1
        coupon.save()

    redirect_url = _build_paypart_url(
        invitation_uuid=invitation_uuid,
        redirection_tag=tag,
        buyer_remark=buyer_remark,
    )
    return Response({"redirect_url": redirect_url, "redirection_tag": tag})


# ─── Verify Payment ────────────────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def verify_payment(request):
    """
    Called from the PaymentSuccess page.
    Body: { "redirection_tag": "<tag>" }
    Polls Paypart's check_transaction, grants access if paid.
    """
    tag = request.data.get("redirection_tag", "").strip()
    if not tag:
        return Response({"error": "redirection_tag requis."}, status=400)

    try:
        payment = Payment.objects.get(redirection_tag=tag, user=request.user)
    except Payment.DoesNotExist:
        return Response({"error": "Paiement introuvable."}, status=404)

    if payment.status == Payment.PAID:
        return Response({"paid": True, "status": payment.status})

    # Poll Paypart
    result = _paypart_check_transaction(tag)
    if result is None:
        return Response({"error": "Erreur de connexion Paypart."}, status=502)

    is_paid = result.get("payed", False)

    if is_paid:
        payment.status = Payment.PAID
        payment.save()
        _grant_access(payment)
        return Response({"paid": True, "status": "paid"})
    else:
        tx_state = result.get("transaction", {}).get("state", "")
        if tx_state in ("canceled", "payed-buyer-cancel-early", "payed-buyer-cancel-mid",
                        "payed-buyer-cancel-late", "payed-seller-cancel", "payed-reimbursed"):
            payment.status = Payment.CANCELED
            payment.save()
        return Response({"paid": False, "status": payment.status, "paypart_state": tx_state})


def _grant_access(payment: Payment):
    """Grant course enrollment or book access based on payment record."""
    user = payment.user
    try:
        if payment.item_type == Payment.TYPE_COURSE:
            enrollment, _ = Enrollment.objects.get_or_create(
                student=user, course_id=payment.item_id
            )
            enrollment.is_approved = True
            enrollment.save()
            logger.info("Enrollment approved: user=%s course=%s", user.id, payment.item_id)
        elif payment.item_type == Payment.TYPE_BOOK:
            BookPurchase.objects.get_or_create(user=user, book_id=payment.item_id)
            logger.info("Book purchase recorded: user=%s book=%s", user.id, payment.item_id)
        elif payment.item_type == Payment.TYPE_CONVERSATION:
            from django.utils import timezone
            from datetime import timedelta
            conv = Conversation.objects.get(id=payment.item_id)
            if not conv.access_expires_at or conv.access_expires_at < timezone.now():
                conv.access_expires_at = timezone.now() + timedelta(days=30)
            else:
                conv.access_expires_at += timedelta(days=30)
            conv.save()
            logger.info("Conversation access prolonged: user=%s conv=%s", user.id, payment.item_id)
    except Exception as e:
        logger.error("_grant_access error: %s", e)


# ─── My Purchased Books ────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_purchased_books(request):
    """Returns all books purchased by the authenticated user."""
    purchases = BookPurchase.objects.filter(user=request.user).select_related("book")
    books = [p.book for p in purchases]
    return Response(BookSerializer(books, many=True, context={"request": request}).data)


# ─── Admin – All Payments ──────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_payments(request):
    """Returns all Payment records. Admin only."""
    payments = Payment.objects.select_related("user").order_by("-created_at")
    data = [
        {
            "id": p.id,
            "user": p.user_id,
            "user_username": p.user.username if p.user else "",
            "item_type": p.item_type,
            "item_id": p.item_id,
            "redirection_tag": p.redirection_tag,
            "paypart_invitation_uuid": p.paypart_invitation_uuid,
            "status": p.status,
            "amount": str(p.amount),
            "delivery_wilaya": p.delivery_wilaya,
            "created_at": p.created_at.isoformat(),
        }
        for p in payments
    ]
    return Response(data)


# ─── Validate Coupon ───────────────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def validate_coupon(request):
    """
    Body: { "coupon_code": "ABC10", "item_type": "course"|"book", "original_price": 15000 }
    Returns coupon details + final price.
    """
    code       = request.data.get("coupon_code", "").strip().upper()
    item_type  = request.data.get("item_type", "")
    orig_price = float(request.data.get("original_price", 0) or 0)

    if not code:
        return Response({"error": "Code requis."}, status=400)

    try:
        coupon = Coupon.objects.get(code=code)
    except Coupon.DoesNotExist:
        return Response({"error": "Code coupon invalide."}, status=400)

    valid, reason = coupon.is_valid(item_type if item_type else None)
    if not valid:
        return Response({"error": reason}, status=400)

    discounted = round(orig_price * (1 - coupon.discount_percent / 100), 2)
    return Response({
        "coupon_code":      coupon.code,
        "discount_percent": coupon.discount_percent,
        "description":      coupon.description,
        "original_price":   orig_price,
        "discounted_price": discounted,
        "savings":          round(orig_price - discounted, 2),
    })


# ─── Admin Coupon CRUD ─────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([permissions.IsAdminUser])
def coupon_list_create(request):
    if request.method == "GET":
        return Response(CouponSerializer(Coupon.objects.all(), many=True).data)
    serializer = CouponSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([permissions.IsAdminUser])
def coupon_detail(request, pk):
    try:
        coupon = Coupon.objects.get(pk=pk)
    except Coupon.DoesNotExist:
        return Response({"error": "Coupon introuvable."}, status=404)

    if request.method == "GET":
        return Response(CouponSerializer(coupon).data)
    if request.method == "PATCH":
        s = CouponSerializer(coupon, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)
    coupon.delete()
    return Response(status=204)
