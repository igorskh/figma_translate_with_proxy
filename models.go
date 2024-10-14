package main

type TranslationRequest struct {
	TargetLanguageCode string `json:"target_language_code"`
	Text               string `json:"text"`
}

type TranslationResponse struct {
	Translations []struct {
		Text string `json:"text"`
	} `json:"translations"`
}
