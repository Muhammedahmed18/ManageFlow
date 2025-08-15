"""
Business Management Utils
========================

Utility functions for business management system.
"""

from django.core.mail import send_mail
from django.conf import settings


def send_request_status_email(manufacturer_request, status):
    """
    Send simple text email notification to manufacturer when request status changes
    """
    try:
        customer = manufacturer_request.customer
        business = manufacturer_request.business
        
        if status == 'approved':
            subject = f"Your request to {business.name} has been approved!"
            message = f"""
Hello {manufacturer_request.manufacturer_name},

Great news! Your {manufacturer_request.request_type} request to {business.name} has been approved.

Customer Response: {manufacturer_request.customer_response or 'No response provided'}

You can now start communicating with {customer.first_name} {customer.last_name} to discuss further details.

Best regards,
ManageFlow Team
            """
        else:  # rejected
            subject = f"Update on your request to {business.name}"
            message = f"""
Hello {manufacturer_request.manufacturer_name},

We wanted to let you know that your {manufacturer_request.request_type} request to {business.name} was not approved at this time.

Customer Response: {manufacturer_request.customer_response or 'No response provided'}

Don't worry! You can continue to discover other customers and send new requests.

Best regards,
ManageFlow Team
            """
        
        # Send email
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[manufacturer_request.manufacturer_email],
            fail_silently=True,  # Don't break the app if email fails
        )
        
        return True
        
    except Exception as e:
        print(f"Failed to send email notification: {e}")
        return False


def send_request_received_email(manufacturer_request):
    """
    Send simple text email notification to customer when they receive a new request
    """
    try:
        customer = manufacturer_request.customer
        business = manufacturer_request.business
        
        subject = f"New {manufacturer_request.request_type} request for {business.name}"
        message = f"""
Hello {customer.first_name} {customer.last_name},

You have received a new {manufacturer_request.request_type} request for your business "{business.name}".

Manufacturer Details:
- Name: {manufacturer_request.manufacturer_name}
- Email: {manufacturer_request.manufacturer_email}
- Company: {manufacturer_request.manufacturer_company or 'Not provided'}

Message: {manufacturer_request.message}

Please log in to your dashboard to review and respond to this request.

Best regards,
ManageFlow Team
        """
        
        # Send email
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[customer.email],
            fail_silently=True,  # Don't break the app if email fails
        )
        
        return True
        
    except Exception as e:
        print(f"Failed to send email notification: {e}")
        return False
