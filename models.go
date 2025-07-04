package main

type TranslationRequest struct {
	TargetLanguageCode string `json:"target_language_code"`
	Text               string `json:"text"`
	RequestDelay       int    `json:"request_delay"` // Delay in milliseconds
}

type TranslationResponse struct {
	Translations []struct {
		Text string `json:"text"`
	} `json:"translations"`
}
