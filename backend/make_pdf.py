from reportlab.pdfgen import canvas

c = canvas.Canvas("test.pdf")
c.drawString(100, 750, "This is a test document for the RAG Portfolio Project.")
c.drawString(100, 730, "We are testing OpenAI Embeddings and Pinecone Upsert.")
c.drawString(100, 710, "If you can retrieve this text, the system works.")
c.save()