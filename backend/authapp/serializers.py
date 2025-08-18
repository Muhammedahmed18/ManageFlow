from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from business.models import Business
from django.contrib.auth import get_user_model
from .models import UserSettings

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    business = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'password', 'role', 'is_approved', 'business')
        extra_kwargs = {'password': {'write_only': True}}

    def get_business(self, obj):
        from business.serializers import BusinessSerializer
        business = Business.objects.filter(owner=obj).first()
        if business:
            return BusinessSerializer(business).data
        return None

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        user.is_approved = (user.role == 'customer')
        user.save()
        return user


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'first_name', 'last_name']

    def create(self, validated_data):
        role = validated_data.get('role')

        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            role=role,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

        if role == 'manufacturer':
            user.is_approved = True
        else:
            user.is_approved = False  # Customers still need approval

        user.set_password(validated_data['password'])
        
        # Generate OTP for email verification
        import random
        user.otp = str(random.randint(100000, 999999))
        
        # Save user with email_verified=False
        user.email_verified = False
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    role = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        role = attrs.get("role")

        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        # Role mismatch check
        if role and user.role != role:
            raise serializers.ValidationError(f"This account is a {user.role}, not a {role}.")

        data = super().validate(attrs)
        data['is_approved'] = bool(user.is_approved)
        data['role'] = user.role
        return data

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = [
            'profile_visibility', 'business_visibility', 'contact_info_visibility', 
            'allow_contact_requests', 'auto_approve_requests', 'require_approval', 
            'max_businesses', 'default_visibility'
        ]
    
    def create(self, validated_data):
        # Create settings for the current user
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)