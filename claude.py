from openai import OpenAI

client = OpenAI(
    api_key="sk-a67e989a3f7d25b0-zw9cph-530fdce1",
    base_url="https://9router.shoplagbe.app/v1"
)

while True:
    question = input("\nYou: ")

    if question.lower() in ["exit", "quit"]:
        break

    response = client.chat.completions.create(
        model="cc/claude-opus-5-5",
        messages=[
            {
                "role": "user",
                "content": question
            }
        ]
    )

    print("\nClaude:")
    print(response.choices[0].message.content)