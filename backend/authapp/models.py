from django.db import models
from django.contrib.auth.models import AbstractUser
import random
import string

class User(AbstractUser):
    ROLE_CHOICES = (
        ('manufacturer', 'Manufacturer'),
        ('customer', 'Customer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    email_verified = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, null=True)
    
    is_approved = models.BooleanField(default=False)  # New
    rejected = models.BooleanField(default=False)