from django.db import models
from authapp.models import User
import random, string

class Business(models.Model):
    name = models.CharField(max_length=255)
    manufacturer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='businesses', limit_choices_to={'role': 'manufacturer'})
    slogan = models.CharField(max_length=255, blank=True, null=True)
    shipping_country = models.CharField(max_length=100)
    invite_code = models.CharField(max_length=20, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = self.generate_invite_code()
        super().save(*args, **kwargs)

    def generate_invite_code(self):
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"BIZ-{code}"

    def __str__(self):
        return self.name
