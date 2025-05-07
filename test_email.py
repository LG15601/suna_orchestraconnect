import asyncio
from services.email import email_service

async def test():
    to_email = input("Entrez votre adresse email pour le test : ")
    result = await email_service.send_email(
        to=[to_email],
        subject='Test Email from OrchestraConnect',
        text_content='This is a test email from OrchestraConnect'
    )
    print(result)

if __name__ == "__main__":
    asyncio.run(test())
