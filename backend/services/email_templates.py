"""
Email templates for OrchestraConnect.

This module provides HTML templates for emails sent by the OrchestraConnect agent.
"""

def get_email_signature():
    """
    Returns the HTML signature for OrchestraConnect emails.

    This signature includes the OrchestraConnect logo, contact information,
    and social media links styled to match the website design.
    """
    return """
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea;">
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; font-family: 'Inter', 'Arial', sans-serif;">
            <tr>
                <td style="vertical-align: middle; padding-right: 20px; width: 140px;">
                    <!-- Utilisation du logo blanc hébergé localement -->
                    <img src="https://orchestraconnect.fr/logo-orchestra-white.jpeg" alt="OrchestraConnect Logo" style="width: 130px; height: auto; display: block; border-radius: 4px;">
                </td>
                <td style="vertical-align: middle;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333333;">Alex</p>
                    <p style="margin: 0; font-size: 14px; color: #666666; font-style: italic;">Concierge | OrchestraConnect</p>
                    <p style="margin: 10px 0 0 0; font-size: 13px; color: #666666;">
                        <a href="mailto:alex@orchestraconnect.fr" style="color: #155dfc; text-decoration: none; font-weight: 500;">alex@orchestraconnect.fr</a>
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #666666;">
                        <a href="https://orchestraconnect.fr" style="color: #155dfc; text-decoration: none; font-weight: 500;">orchestraconnect.fr</a>
                    </p>
                    <div style="margin-top: 12px;">
                        <a href="https://linkedin.com/company/orchestraconnect" style="text-decoration: none; margin-right: 10px; display: inline-block;">
                            <img src="https://i.ibb.co/LrVMXNR/linkedin-icon.png" alt="LinkedIn" style="width: 24px; height: 24px;">
                        </a>
                        <a href="https://twitter.com/orchestraconnect" style="text-decoration: none; margin-right: 10px; display: inline-block;">
                            <img src="https://i.ibb.co/sRH7TK2/twitter-icon.png" alt="Twitter" style="width: 24px; height: 24px;">
                        </a>
                        <a href="https://orchestraconnect.fr" style="text-decoration: none; display: inline-block;">
                            <img src="https://i.ibb.co/kG9Lxh0/web-icon.png" alt="Website" style="width: 24px; height: 24px;">
                        </a>
                    </div>
                </td>
            </tr>
        </table>
        <p style="margin-top: 15px; font-size: 12px; color: #999999; font-family: 'Inter', 'Arial', sans-serif; font-style: italic; line-height: 1.4;">
            Ce message est confidentiel et peut contenir des informations privilégiées. Si vous n'êtes pas le destinataire prévu, veuillez informer l'expéditeur et supprimer ce message.
        </p>
    </div>
    """

def wrap_email_content(content, include_signature=True):
    """
    Wraps the email content in a styled template with optional signature.

    Args:
        content: The HTML content of the email
        include_signature: Whether to include the signature (default: True)

    Returns:
        Complete HTML email with styling and optional signature
    """
    signature = get_email_signature() if include_signature else ""

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OrchestraConnect</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            body {{
                font-family: 'Inter', 'Arial', sans-serif;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
                background-color: #0a0a0a;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                padding: 30px;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border: 1px solid #eaeaea;
            }}
            .logo-header {{
                text-align: center;
                margin-bottom: 25px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eaeaea;
            }}
            .logo-header img {{
                width: 150px;
                height: auto;
            }}
            .content {{
                padding: 0;
                font-size: 16px;
                color: #333333;
                line-height: 1.7;
            }}
            h1, h2, h3, h4, h5, h6 {{
                color: #155dfc;
                margin-top: 0;
                font-weight: 600;
                line-height: 1.3;
            }}
            h1 {{
                font-size: 26px;
                margin-bottom: 20px;
                color: #155dfc;
            }}
            h2 {{
                font-size: 22px;
                margin-bottom: 16px;
                color: #155dfc;
            }}
            p {{
                margin-bottom: 16px;
            }}
            ul {{
                padding-left: 20px;
                margin-bottom: 20px;
            }}
            li {{
                margin-bottom: 10px;
            }}
            a {{
                color: #155dfc;
                text-decoration: none;
                font-weight: 500;
                transition: color 0.2s ease;
            }}
            a:hover {{
                color: #0e4ad0;
                text-decoration: underline;
            }}
            .button {{
                display: inline-block;
                background-color: #155dfc;
                color: white !important;
                font-weight: 600;
                font-size: 16px;
                line-height: 20px;
                padding: 12px 28px;
                border-radius: 8px;
                text-decoration: none;
                margin: 20px 0;
                box-shadow: 0 2px 4px rgba(21, 93, 252, 0.2);
                transition: all 0.2s ease;
                text-align: center;
            }}
            .button:hover {{
                background-color: #0e4ad0;
                text-decoration: none;
                box-shadow: 0 4px 8px rgba(21, 93, 252, 0.3);
                transform: translateY(-1px);
            }}
            .highlight {{
                background-color: #f8f9fa;
                border-left: 4px solid #155dfc;
                padding: 18px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
            }}
            .quote {{
                font-style: italic;
                color: #555555;
                padding-left: 16px;
                border-left: 3px solid #dddddd;
                margin: 20px 0;
            }}
            .footer-note {{
                font-size: 14px;
                color: #777777;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eaeaea;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                {content}
            </div>
            {signature}
        </div>
    </body>
    </html>
    """
