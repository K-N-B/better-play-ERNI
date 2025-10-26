import os
import json
from groq import Groq


class ErnigramGeneratorAI:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        # Using a model with a larger context window and better reasoning is often helpful for this
        self.model = "llama-3.3-70b-versatile"
        # New: A set to store the titles of articles already used.
        self.used_titles = set()

    # Note: We are no longer using self.used_titles inside the class
    # because history is managed externally by the caller.
    def generate_from_articles(self, articles, titles_to_exclude=None):
        """
        Picks the most relevant article, ensuring it's not any of the excluded phrases.
        The clue must not reuse words from the title.
        """
        # Ensure the list is a set for quick lookups and default to empty set
        if titles_to_exclude is None:
            titles_to_exclude = set()

        # Filter the input articles *again* based on the passed list
        available_articles = [
            article for article in articles
            if article.get('title', '').upper() not in titles_to_exclude
        ]

        # Handle case where all are excluded
        if not available_articles:
            return {
                "solution_phrase": "NO UNIQUE ARTICLES AVAILABLE",
                "clue": "All unique articles have been used from the current feed."
            }

        # 1. Create the strong exclusion instruction for the LLM
        exclusion_instruction = ""
        if titles_to_exclude:
            # We only show the model the list of articles it *can* choose from,
            # so the instruction is now simplified to emphasize variety.
            pass  # No need for a CRITICAL RULE if we pre-filter the input

        prompt = f"""
        You are a creative assistant that turns news headlines into puzzles.
        
        Given several available articles, pick one that is interesting and current. 
        **CRITICAL RULE: Since you are running repeatedly, choose a headline that offers the best blend of relevance and novelty (i.e., do not always choose the most important one).**
        
        Then respond with:
        1. Create a short "solution_phrase" — a concise 3–5 word summary inspired by the headline, written in UPPERCASE. 
        - Must NOT include punctuation or symbols such as , . ! ? - ’ “ ” : or any special characters.
        - It should not copy the full headline.
        - Avoid long phrases or full sentences.
        - It should sound like a clean, key phrase or concept from the story.

        2. Create a "clue" — a one-sentence hint that:
        - Relates to the story naturally.
        - Does NOT reuse any words from the title or the solution phrase.
        - Feels relevant but not too obvious.
        - Keeps the reader curious.

        Return strict JSON format:
        {{
             "solution_phrase": "...",
             "clue": "..."
        }}

        Here are the *available* articles:
        {json.dumps(available_articles, indent=2)}
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system",
                    "content": "You generate subtle clues for puzzle headlines. Respond only with the required JSON object."},
                {"role": "user", "content": prompt},
            ],
            # Keep temperature high, but the pre-filtering is the primary fix
            temperature=1.2,
            max_tokens=250,
            response_format={"type": "json_object"},
        )

        # ... (JSON parsing and return logic remains the same) ...
        # (Make sure the parsing logic uses the full list of titles_to_exclude for history update if you move the history tracking back into the class, but we assume it's external for now)

        result = json.loads(response.choices[0].message.content)
        return {
            "solution_phrase": result["solution_phrase"].upper(),
            "clue": result["clue"]
        }

# Example Usage (assuming you have a list of articles and the API key is set)
# articles_list = [
#     {"title": "Global Leaders Meet to Discuss Climate Change", "url": "..."},
#     {"title": "New Study Finds Link Between Sleep and Memory", "url": "..."},
#     # ... 8 more articles
# ]
# generator = ErnigramGeneratorAI()
# first_result = generator.generate_from_articles(articles_list) # Will pick the first unique one
# second_result = generator.generate_from_articles(articles_list) # Will pick a different unique one
