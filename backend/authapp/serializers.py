from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from business.models import Business  # ✅ moved import to top

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        role = validated_data.get('role')

        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            role=role
        )

        if role == 'manufacturer':
            user.is_approved = True
        else:
            user.is_approved = False  # Customers still need approval

        user.set_password(validated_data['password'])
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    business_id = serializers.CharField(write_only=True, required=False)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        business_id = self.initial_data.get("business_id")

        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        if user.role == 'customer':
            if not business_id:
                raise serializers.ValidationError({"business_id": "Business invite code is required for customers."})

            try:
                business = Business.objects.get(invite_code=business_id)
            except Business.DoesNotExist:
                raise serializers.ValidationError({"business_id": "Invalid business invite code."})

            if not user.business:
                user.business = business
                user.save()
            elif user.business != business:
                raise serializers.ValidationError({"business_id": "This customer is not linked to that business."})

        # ✅ Let login proceed regardless of approval (frontend handles it)
        data = super().validate(attrs)
        data['is_approved'] = bool(user.is_approved)
        data['role'] = user.role
        data['business_id'] = user.business_id
        return data