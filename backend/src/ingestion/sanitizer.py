import re

class TextSanitizer:
    @staticmethod
    def sanitize(text: str) -> str:
        if not text:
            return ""

        # Remove null bytes and non-printable control characters
        text = text.replace("\x00", "")
        text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f]", " ", text)

        # Neutralize potential prompt injection tags and script tags
        text = re.sub(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", " ", text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<\s*/?untrusted_document\s*>", " ", text, flags=re.IGNORECASE)

        # Normalize whitespace
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)

        return text.strip()
