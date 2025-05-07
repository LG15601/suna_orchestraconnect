"""
Test script for the email service.

This script tests sending an email using the Resend service.
"""

import asyncio
import os
from dotenv import load_dotenv
from services.email import email_service
from utils.logger import logger

async def test_email():
    """Test sending an email using the Resend service."""

    # Load environment variables
    load_dotenv()

    # Check if RESEND_API_KEY is set
    if not os.getenv("RESEND_API_KEY"):
        print("RESEND_API_KEY is not set in the environment. Please set it in the .env file.")
        return

    # Test recipient email
    to_email = input("Enter recipient email address: ")

    # Send a test email
    result = await email_service.send_email(
        to=[to_email],
        subject="Test Email from OrchestraConnect",
        html_content="""
        <h1>Bonjour de OrchestraConnect!</h1>
        <p>Ceci est un email de test envoyé depuis le service d'email OrchestraConnect avec notre nouvelle signature professionnelle.</p>

        <p>Si vous voyez cet email avec sa mise en forme et sa signature, le service fonctionne correctement.</p>

        <p>Voici quelques fonctionnalités que notre concierge Alex peut réaliser :</p>
        <ul>
            <li>Envoyer des emails de prospection commerciale</li>
            <li>Faire de l'intermédiation entre clients et prestataires</li>
            <li>Envoyer des suivis de campagnes</li>
            <li>Communiquer avec des prospects</li>
        </ul>

        <p>Vous pouvez également inclure des boutons d'action :</p>
        <a href="https://orchestraconnect.fr" class="button">Visiter notre site</a>

        <p>Cordialement,</p>
        """
    )

    if "error" in result:
        print(f"Error sending email: {result['error']}")
    else:
        print(f"Email sent successfully: {result.get('data', {})}")

if __name__ == "__main__":
    asyncio.run(test_email())
