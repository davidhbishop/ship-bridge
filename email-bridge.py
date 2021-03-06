#!/usr/bin/env python
# coding: utf-8

import datetime
import requests
import smtplib
import time
import os

from bs4 import BeautifulSoup as bs


web_charset = "utf-8"
mail_charset = "ISO-2022-JP"

targeturl = "http://bella-heart/email.php"  # Target URL for scraping
targetclass = "h1"  # Target element for scraping

#Email Variables
SMTP_SERVER = 'smtp.gmail.com' #Email Server (don't change!)
SMTP_PORT = 465 #Server Port (don't change!)
GMAIL_USERNAME = os.getenv("MAIL_USERNAME") #change this to match your gmail account
GMAIL_PASSWORD = os.getenv("MAIL_PASSWORD")  #change this to match your gmail password

statusOK = u"Found / "
statusNG = u"Not Found"

def scraping(url):
	try:
		soup = bs(requests.get(url).content, "html.parser")
		target = soup.renderContents()
		if len(target) == 0:
			return statusNG
		else:
			return target.decode(web_charset)
	except:
		return statusNG


class Emailer:
	def sendmail(self, recipient, subject, content, username, password):
		# Create Headers
		headers = ["From: " + GMAIL_USERNAME, "Subject: " + subject, "To: " + recipient,
				   "MIME-Version: 1.0", "Content-Type: text/html"]
		headers = "\r\n".join(headers)

		# Connect to Gmail Server
		session = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
		session.ehlo()


		# Login to Gmail
		session.login(username, password)

		# Send Email & Exit
		session.sendmail(GMAIL_USERNAME, recipient, headers + "\r\n\r\n" + content)
		session.quit


sender = Emailer()

if __name__ == "__main__":
	sendTo = 'davidhenrybishop@gmail.com'
	emailSubject = "Troppo Bella - Daily logbook"
	emailContent = scraping(targeturl)
	sender.sendmail(sendTo, emailSubject, emailContent, GMAIL_USERNAME, GMAIL_PASSWORD)
	print("Email Sent")
