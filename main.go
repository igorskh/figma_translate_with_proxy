package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

var deepLAPIKey = ""

const deepLAPIURL = "https://api-free.deepl.com/v2/translate"

func translateHandler(w http.ResponseWriter, r *http.Request) {
	var req TranslationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	translatedText, err := translateText(req.Text, req.TargetLanguageCode)
	if err != nil {
		http.Error(w, "Failed to translate text", http.StatusInternalServerError)
		return
	}

	resp := map[string]string{"translated_text": translatedText}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func translateText(text string, targetLanguageCode string) (string, error) {
	reqBody := fmt.Sprintf("auth_key=%s&text=%s&target_lang=%s", deepLAPIKey, text, targetLanguageCode)
	resp, err := http.Post(deepLAPIURL, "application/x-www-form-urlencoded", strings.NewReader(reqBody))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var translationResp TranslationResponse
	if err := json.Unmarshal(body, &translationResp); err != nil {
		return "", err
	}

	if len(translationResp.Translations) > 0 {
		return translationResp.Translations[0].Text, nil
	}

	return "", fmt.Errorf("no translations found")
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			return
		}
		next.ServeHTTP(w, r)
	})
}
func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	deepLAPIKey = os.Getenv("DEEPL_API_KEY")

	http.Handle("/translate", corsMiddleware(http.HandlerFunc(translateHandler)))
	log.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
