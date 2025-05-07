"""
Email service for sending emails using Resend.

This module provides functionality to send emails using the Resend API.
It supports sending plain text and HTML emails with optional attachments.
"""

import os
from typing import List, Optional, Dict, Any
from utils.logger import logger
from utils.config import config
from services.email_templates import wrap_email_content

class EmailService:
    """Service for sending emails using Resend."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the email service with the Resend API key.

        Args:
            api_key: Optional API key to override the one in config
        """
        self.api_key = api_key or getattr(config, 'RESEND_API_KEY', None)
        if not self.api_key:
            logger.warning("RESEND_API_KEY not found in configuration")

        # Import here to avoid issues if the package is not installed
        try:
            import resend
            # The Python SDK uses a different pattern than the Node.js SDK
            resend.api_key = self.api_key
            self.resend = resend
            self.is_initialized = True
        except ImportError:
            logger.error("Resend package not installed. Please install with 'pip install resend'")
            self.is_initialized = False
        except Exception as e:
            logger.error(f"Error initializing Resend: {str(e)}")
            self.is_initialized = False

    async def send_email(
        self,
        to: List[str],
        subject: str,
        html_content: Optional[str] = None,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Send an email using Resend.

        Args:
            to: List of recipient email addresses
            subject: Email subject
            html_content: HTML content of the email (optional)
            text_content: Plain text content of the email (optional)
            from_email: Sender email address (defaults to config value)
            from_name: Sender name (defaults to config value)
            cc: List of CC recipients (optional)
            bcc: List of BCC recipients (optional)
            reply_to: Reply-to email address (optional)
            attachments: List of attachment objects with 'path' and 'filename' keys (optional)

        Returns:
            Dict containing the response from Resend API
        """
        if not self.is_initialized:
            logger.error("Email service not properly initialized")
            return {"error": "Email service not properly initialized"}

        if not html_content and not text_content:
            logger.error("Either html_content or text_content must be provided")
            return {"error": "Either html_content or text_content must be provided"}

        try:
            # Set default from_email, from_name and reply_to if not provided
            default_from_email = getattr(config, 'EMAIL_FROM_ADDRESS', 'alex@orchestraconnect.fr')
            default_from_name = getattr(config, 'EMAIL_FROM_NAME', 'Alex - OrchestraConnect')
            default_reply_to = getattr(config, 'EMAIL_REPLY_TO', 'alex@orchestraconnect.fr')

            from_email = from_email or default_from_email
            from_name = from_name or default_from_name
            reply_to = reply_to or default_reply_to

            # Prepare the email payload
            payload = {
                "from": f"{from_name} <{from_email}>",
                "to": to,
                "subject": subject,
                "reply_to": reply_to  # Always include reply_to (now has a default value)
            }

            # Add optional parameters if provided
            if html_content:
                # Wrap HTML content in our template with signature
                payload["html"] = wrap_email_content(html_content)
            if text_content:
                payload["text"] = text_content
            if cc:
                payload["cc"] = cc
            if bcc:
                payload["bcc"] = bcc
            if attachments:
                payload["attachments"] = attachments

            # Use the Python SDK to send the email
            try:
                # The Python SDK has a different API structure
                email_params = {
                    "from": payload["from"],
                    "to": payload["to"],
                    "subject": payload["subject"]
                }

                # Add optional parameters if provided
                if "html" in payload:
                    email_params["html"] = payload["html"]
                if "text" in payload:
                    email_params["text"] = payload["text"]
                if "cc" in payload:
                    email_params["cc"] = payload["cc"]
                if "bcc" in payload:
                    email_params["bcc"] = payload["bcc"]
                if "reply_to" in payload:
                    email_params["reply_to"] = payload["reply_to"]
                if "attachments" in payload:
                    email_params["attachments"] = payload["attachments"]

                # Send the email using the Python SDK
                response = self.resend.Emails.send(email_params)

                logger.info(f"Email sent successfully: {response['id']}")
                return {"success": True, "data": {"id": response['id']}}
            except Exception as e:
                error_message = str(e)
                logger.error(f"Error sending email with Resend API: {error_message}")
                return {"error": error_message}

        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return {"error": str(e)}

# Create a singleton instance
email_service = EmailService()
