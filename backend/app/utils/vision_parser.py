import fitz  # PyMuPDF
import base64
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

class VisionParser:
    def __init__(self, google_api_key: str):
        # UPDATED: Use the model you confirmed works (2.5-flash)
        self.vision_llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0,
            google_api_key=google_api_key
        )

    def extract_and_describe_images(self, pdf_path: str):
        """
        Iterates through PDF, finds images, sends them to Gemini for description.
        Returns a list of LangChain Documents containing the descriptions.
        """
        doc = fitz.open(pdf_path)
        image_docs = []

        print(f"👁️ Scanning {pdf_path} for images...")

        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)

            if not image_list:
                continue

            print(f"   --> Found {len(image_list)} images on Page {page_num + 1}")

            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                
                # Filter out tiny icons (noise)
                if len(image_bytes) < 5000: 
                    continue

                # Get description
                description = self._get_image_summary(image_bytes)
                
                if description:
                    new_doc = Document(
                        page_content=f"*** [IMAGE DESCRIPTION] (Page {page_num + 1}) ***\n{description}",
                        metadata={
                            "source": f"Image on Page {page_num + 1}",
                            "page": page_num + 1,
                            "type": "image_description"
                        }
                    )
                    image_docs.append(new_doc)

        return image_docs

    def _get_image_summary(self, image_bytes):
        try:
            b64_string = base64.b64encode(image_bytes).decode("utf-8")
            message = HumanMessage(
                content=[
                    {"type": "text", "text": "Analyze this image in detail. Read all data values, axis labels, and text inside diagrams. If decorative, return empty string."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_string}"}}
                ]
            )
            response = self.vision_llm.invoke([message])
            return response.content
        except Exception as e:
            print(f"   ❌ Vision Error: {e}")
            return None