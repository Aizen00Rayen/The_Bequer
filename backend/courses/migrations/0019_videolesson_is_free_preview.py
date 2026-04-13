from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0018_book_admin_discount_percent_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='videolesson',
            name='is_free_preview',
            field=models.BooleanField(default=False, verbose_name="Vidéo d'aperçu gratuite"),
        ),
    ]
