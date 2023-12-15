import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import express from "express";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const apiKey = process.env.AZURE_SPEECH_TO_TEXT_API_KEY;
if (!apiKey) throw Error("apiKey is invalid.");
const apiRegion = process.env.AZURE_SPEECH_TO_TEXT_REGION;
if (!apiRegion) throw Error("apiRegion is invalid.");

const app = express();
const port = 3000;

const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, apiRegion);
speechConfig.speechRecognitionLanguage = "en-US";

const pronunciationAssessmentConfig =
  new SpeechSDK.PronunciationAssessmentConfig(
    "The article mentioned that this year's Kanji award in Japan was Zei. I can't understand why this Kanji was chosen, as I left Japan in August. From this article, I learned that I should have continued checking Japanese news as much as possible, even though I was very busy. Otherwise, I might struggle to have conversations with someone someday.",
    SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
    SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
    true
  );

app.get("/assess-pronunciation", (req, res) => {
  try {
    const audioConfig = SpeechSDK.AudioConfig.fromWavFileInput(
      fs.readFileSync("./13122023.wav")
    );
    const recognizer = new SpeechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    pronunciationAssessmentConfig.applyTo(recognizer);

    recognizer.recognizeOnceAsync((result) => {
      if (result) {
        console.log(`RECOGNIZED: Text=${result.text}`);
        const pronunciationResult =
          SpeechSDK.PronunciationAssessmentResult.fromResult(result);
        console.log(
          `Pronunciation Score: ${pronunciationResult.pronunciationScore}`
        );

        console.log("SCORE OF EACH WORD:");
        if (pronunciationResult.detailResult) {
          pronunciationResult.detailResult.Words.forEach((word) => {
            console.log(
              `Word: ${word.Word}, AccuracyScore: ${word.PronunciationAssessment?.AccuracyScore}, ErrorType: ${word.PronunciationAssessment?.ErrorType}`
            );
          });
        }

        res.json(pronunciationResult);
      } else {
        res.status(400).send("No result received");
      }
    });
  } catch (e) {
    console.log(e);
    res.send(e);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
