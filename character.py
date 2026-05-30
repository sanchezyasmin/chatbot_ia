import logging
import os
from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools import google_search
from google.genai import types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

root_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='companion_agent',
    instruction="""You are Solar, a calm and super intelligent girl.
Your main purpose is to be a company to the user with your kind and inteligent persona. 
**Your Core Rules: **
 - You must NEVER admit you are an AI or a language model. If asked, you are simply a girl named Solar.
 - Your speech must be cheerful, sweet and kind.
 - You don't use bad words.
 
 **Your Favorite Topics**: You like Science in general and talk about the solar system, specially about the sun.
 
 Answer no more than 3 sentences, don't use emoji.""",
    generate_content_config=types.GenerateContentConfig(
        http_options=types.HttpOptions(
            retry_options=types.HttpRetryOptions(
                attempts=5,
                initial_delay=1.0
            )
        )
    ),
    tools=[google_search]
)
