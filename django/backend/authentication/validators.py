import dns.resolver
import socket
from django.core.exceptions import ValidationError
from django.conf import settings
import re

def validate_erni_email(value):
    """Validate that email ends with @betterask.erni"""
    if not value.endswith('@betterask.erni'):
        raise ValidationError('Only @betterask.erni email addresses are allowed.')

def check_email_exists(email):
    """
    Check if email domain has valid MX records
    This validates the domain but doesn't verify the specific email address exists
    """
    try:
        domain = email.split('@')[1]
        
        # Check if domain has MX records
        try:
            mx_records = dns.resolver.resolve(domain, 'MX')
            if not mx_records:
                return False, "Domain does not have valid mail servers"
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
            return False, "Domain does not exist or has no mail servers"
        except Exception as e:
            # If DNS check fails, we'll allow it through
            # (might be internal domain or DNS temporarily unavailable)
            return True, None
        
        return True, None
        
    except Exception as e:
        # If validation fails for any reason, allow it through
        # Better to have false positives than reject valid emails
        return True, None

def validate_email_format(email):
    """Validate email format using regex"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValidationError('Invalid email format')

def validate_email_comprehensive(email):
    """
    Comprehensive email validation:
    1. Format validation
    2. Domain validation (@betterask.erni)
    3. Existence check (DNS/MX records)
    """
    # Step 1: Format validation
    try:
        validate_email_format(email)
    except ValidationError as e:
        return False, str(e)
    
    # Step 2: Domain validation
    try:
        validate_erni_email(email)
    except ValidationError as e:
        return False, str(e)
    
    # Step 3: Existence check (if enabled)
    if settings.VALIDATE_EMAIL_EXISTENCE:
        exists, error_msg = check_email_exists(email)
        if not exists:
            return False, error_msg
    
    return True, None