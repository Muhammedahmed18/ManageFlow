from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import random
import string

class User(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('manufacturer', 'Manufacturer'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    email_verified = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    rejected = models.BooleanField(default=False)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    is_rejected = models.BooleanField(default=False)
    
    def __str__(self):
        return self.username

class UserSettings(models.Model):
    """User settings and preferences"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    
    # Privacy settings
    profile_visibility = models.CharField(max_length=20, choices=[
        ('public', 'Public'),
        ('private', 'Private'),
        ('contacts', 'Contacts Only')
    ], default='public')
    
    business_visibility = models.CharField(max_length=20, choices=[
        ('public', 'Public'),
        ('private', 'Private'),
        ('contacts', 'Contacts Only')
    ], default='public')
    
    contact_info_visibility = models.CharField(max_length=20, choices=[
        ('public', 'Public'),
        ('private', 'Private'),
        ('contacts', 'Contacts Only')
    ], default='private')
    
    allow_contact_requests = models.BooleanField(default=True)
    
    # Business settings
    auto_approve_requests = models.BooleanField(default=False)
    require_approval = models.BooleanField(default=True)
    max_businesses = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(50)],
        default=5,
        help_text="Maximum number of businesses a user can create"
    )
    default_visibility = models.CharField(max_length=20, choices=[
        ('public', 'Public'),
        ('private', 'Private')
    ], default='public')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "User Settings"
    
    def __str__(self):
        return f"Settings for {self.user.username}"