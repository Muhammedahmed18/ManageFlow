from django.db import models
from authapp.models import User
import random, string
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

def generate_invite_code():
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"BIZ- {code}"

class Business(models.Model):
    name = models.CharField(max_length=255)
    invite_code = models.CharField(max_length=12, unique=True, default=generate_invite_code)
    owner = models.ForeignKey(User, related_name='owned_businesses', on_delete=models.CASCADE, null=True, blank=True) # customer
    manufacturer = models.ForeignKey(User, related_name='approved_businesses', on_delete=models.SET_NULL, null=True, blank=True)
    pending_manufacturers = models.ManyToManyField(User, related_name='pending_businesses', blank=True)
    rejected_manufacturers = models.ManyToManyField(User, related_name='rejected_businesses', blank=True)
    slogan = models.CharField(max_length=255, blank=True, null=True)
    shipping_country = models.CharField(max_length=100)

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = generate_invite_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
