"""
Email tool for the agent to send emails.

This tool allows the agent to send emails using the Resend service.
It provides methods for sending emails with HTML or plain text content.
"""

from typing import List, Optional, Dict, Any
from agentpress.tool import Tool, ToolResult, openapi_schema, xml_schema
from services.email import email_service
from utils.logger import logger

class EmailTool(Tool):
    """Tool for sending emails using Resend."""

    def __init__(self):
        """Initialize the email tool."""
        super().__init__()
        self.email_service = email_service
        logger.info("EmailTool initialized with email_service.is_initialized=%s", self.email_service.is_initialized)

    @xml_schema(
        tag_name="send-email",
        mappings=[
            {"param_name": "to", "node_type": "attribute", "path": "."},
            {"param_name": "subject", "node_type": "attribute", "path": "."},
            {"param_name": "html_content", "node_type": "content", "path": "html_content"},
            {"param_name": "text_content", "node_type": "content", "path": "text_content"},
            {"param_name": "from_name", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "from_email", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "cc", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "bcc", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "reply_to", "node_type": "attribute", "path": ".", "required": False}
        ],
        example='''
        <!--
        The send-email tool sends an email using the Resend service.
        You must provide 'to', 'subject', and either 'html_content' or 'text_content'.
        The 'to', 'cc', and 'bcc' parameters can be comma-separated lists of email addresses.
        -->

        <!-- Example with HTML content -->
        <send-email
            to="recipient@example.com"
            subject="Meeting Request from OrchestraConnect"
            from_name="Alex - Conciergerie OrchestraConnect"
            from_email="alex@orchestraconnect.fr"
            reply_to="alex@orchestraconnect.fr">
            <html_content>
                <h1>Bonjour!</h1>
                <p>Je vous contacte pour proposer un rendez-vous afin de discuter d'opportunités de collaboration potentielles.</p>
                <p>Seriez-vous disponible la semaine prochaine pour un appel de 30 minutes?</p>
                <p>Cordialement,</p>
                <!-- Note: No need to add signature here as it will be added automatically -->
            </html_content>
        </send-email>

        <!-- Example with plain text content -->
        <send-email
            to="recipient@example.com, recipient2@example.com"
            subject="Follow-up from OrchestraConnect"
            cc="manager@example.com">
            <text_content>
                Hello,

                Thank you for our conversation earlier. As promised, I'm following up with more information.

                Best regards,
                Alex
                OrchestraConnect Concierge
            </text_content>
        </send-email>
        '''
    )
    async def send_email(
        self,
        to: str,
        subject: str,
        html_content: Optional[str] = None,
        text_content: Optional[str] = None,
        from_name: Optional[str] = None,
        from_email: Optional[str] = None,
        cc: str = "",
        bcc: str = "",
        reply_to: str = ""
    ) -> ToolResult:
        logger.info(f"Email tool called with to={to}, subject={subject}, cc={cc}, bcc={bcc}, reply_to={reply_to}")
        logger.info(f"Email service initialized: {self.email_service.is_initialized}")
        """
        Send an email using the Resend service.

        Args:
            to: Comma-separated list of recipient email addresses
            subject: Email subject
            html_content: HTML content of the email (optional)
            text_content: Plain text content of the email (optional)
            from_name: Sender name (optional)
            from_email: Sender email address (optional)
            cc: Comma-separated list of CC recipients (optional)
            bcc: Comma-separated list of BCC recipients (optional)
            reply_to: Reply-to email address (optional)

        Returns:
            ToolResult indicating success or failure
        """
        if not self.email_service.is_initialized:
            return ToolResult(
                success=False,
                output="Email service is not properly initialized. Please check if RESEND_API_KEY is set in the environment."
            )

        if not html_content and not text_content:
            return ToolResult(
                success=False,
                output="Either html_content or text_content must be provided."
            )

        try:
            # Convert comma-separated strings to lists
            to_list = [email.strip() for email in to.split(',')]
            cc_list = [email.strip() for email in cc.split(',')] if cc and cc.strip() else None
            bcc_list = [email.strip() for email in bcc.split(',')] if bcc and bcc.strip() else None

            # Send the email
            result = await self.email_service.send_email(
                to=to_list,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                from_name=from_name,
                from_email=from_email,
                cc=cc_list,
                bcc=bcc_list,
                reply_to=reply_to if reply_to and reply_to.strip() else None
            )

            if "error" in result:
                return ToolResult(
                    success=False,
                    output=f"Failed to send email: {result['error']}"
                )

            return ToolResult(
                success=True,
                output=f"Email sent successfully to {to}"
            )

        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return ToolResult(
                success=False,
                output=f"Error sending email: {str(e)}"
            )
