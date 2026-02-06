import { db } from "@/config/firebase.config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LoaderPage } from "./loader-page";
import { CustomBreadCrumb } from "@/components/custom-bread-crumb";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, WebcamIcon, Loader } from "lucide-react";
import { InterviewPin } from "@/components/pin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import WebCam from "react-webcam";
import { useAuth } from "@clerk/clerk-react";
import { chatSession } from "@/scripts";
import { toast } from "sonner";

const CreateEditPage = () => {
  const { interviewId } = useParams();
  const { userId } = useAuth();

  const [interview, setInterview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWebCamEnabled, setIsWebCamEnabled] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const [form, setForm] = useState({
    name: "",
    position: "",
    experience: "",
    description: "",
    techStack: "",
  });

  const navigate = useNavigate();

  // Fetch existing interview in EDIT mode
  useEffect(() => {
    if (!interviewId) return; // CREATE MODE — skip loading interview

    const fetchInterview = async () => {
      setIsLoading(true);
      try {
        const ref = doc(db, "interviews", interviewId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setInterview(data);

          // Fill form with existing data
          setForm({
            name: data.name || "",
            position: data.position || "",
            experience: data.experience || "",
            description: data.description || "",
            techStack: data.techStack || "",
          });
        }
      } catch (err) {
        console.error("Failed to load interview", err);
      }
      setIsLoading(false);
    };

    fetchInterview();
  }, [interviewId]);

  // Handle input changes
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Clean AI response to extract JSON
  const cleanAiResponse = (responseText) => {
    let cleanText = responseText.trim();
    cleanText = cleanText.replace(/(json|```|`)/g, "");

    const jsonArrayMatch = cleanText.match(/\[.*\]/s);
    if (jsonArrayMatch) {
      cleanText = jsonArrayMatch[0];
    } else {
      throw new Error("No JSON array found in response");
    }

    try {
      return JSON.parse(cleanText);
    } catch (error) {
      throw new Error("Invalid JSON format: " + (error?.message || ""));
    }
  };

  // Generate AI questions based on form data
  const generateAiResponse = async (data) => {
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file."
      );
    }

    const prompt = `
      As an experienced prompt engineer, generate a JSON array containing 5 technical interview questions along with detailed answers based on the following job information. Each object in the array should have the fields "question" and "answer", formatted as follows:

      [
        { "question": "<Question text>", "answer": "<Answer text>" },
        ...
      ]

      Job Information:
      - Job Position: ${data?.position}
      - Job Description: ${data?.description}
      - Years of Experience Required: ${data?.experience}
      - Tech Stacks: ${data?.techStack || "General"}

      The questions should assess skills in ${data?.techStack || "general"} development and best practices, problem-solving, and experience handling complex requirements. Please format the output strictly as an array of JSON objects without any additional labels, code blocks, or explanations. Return only the JSON array with questions and answers.
    `;

    try {
      const aiResult = await chatSession.sendMessage(prompt);
      
      if (!aiResult || !aiResult.response) {
        throw new Error("Invalid response from Gemini API");
      }

      const responseText = aiResult.response.text();
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      const cleanedResponse = cleanAiResponse(responseText);
      return cleanedResponse;
    } catch (error) {
      // Provide more specific error messages
      if (error.message?.includes("API_KEY")) {
        throw new Error(
          "Invalid or missing Gemini API key. Please check your .env file."
        );
      }
      if (error.message?.includes("quota") || error.message?.includes("limit")) {
        throw new Error(
          "API quota exceeded. Please check your Gemini API usage limits."
        );
      }
      if (error.message?.includes("network") || error.message?.includes("fetch")) {
        throw new Error(
          "Network error. Please check your internet connection and try again."
        );
      }
      throw error;
    }
  };

  // Save (Create or Update)
  const handleSave = async () => {
    if (!form.name || !form.position || !form.experience) {
      toast.error("Error", {
        description: "Please fill all required fields.",
      });
      return;
    }

    try {
      setIsGeneratingQuestions(true);

      // Generate questions using AI
      const aiResult = await generateAiResponse({
        position: form.position,
        description: form.description,
        experience: form.experience,
        techStack: form.techStack || form.description,
      });

      const id = interviewId || crypto.randomUUID();
      const ref = doc(db, "interviews", id);

      const payload = {
        id,
        userId,
        ...form,
        questions: aiResult, // Add the generated questions
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(ref, payload, { merge: true });

      toast.success("Success", {
        description: interviewId
          ? "Interview updated successfully!"
          : "Interview created successfully!",
      });

      navigate(`/generate/${id}`);
    } catch (error) {
      console.error("Error generating questions:", error);
      
      // Show specific error message
      let errorMessage = "Failed to generate questions. Please try again later.";
      
      if (error.message?.includes("API key")) {
        errorMessage = "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file and restart the dev server.";
      } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
        errorMessage = "API quota exceeded. Please check your Gemini API usage limits.";
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message?.includes("JSON")) {
        errorMessage = "Failed to parse AI response. The API may have returned invalid data.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  if (isLoading) return <LoaderPage />;

  return (
    <div className="flex flex-col w-full gap-8 py-5">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between w-full gap-2">
        <CustomBreadCrumb
          breadCrumbPage={interview ? interview.position : "Create Interview"}
          breadCrumpItems={[{ label: "Mock Interviews", link: "/generate" }]}
        />

        {interviewId && (
          <Link to={`/generate/interview/${interviewId}/start`}>
            <Button size="sm">
              Start <Sparkles />
            </Button>
          </Link>
        )}
      </div>

      {/* FORM UI */}
      <div className="border p-6 rounded-lg shadow-sm bg-white flex flex-col gap-4">
        <h2 className="text-xl font-semibold mb-2">
          {interviewId ? "Edit Interview" : "Create New Interview"}
        </h2>

        <div>
          <label className="text-sm font-medium">Your Name *</label>
          <input
            className="border rounded w-full p-2 mt-1"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={isGeneratingQuestions}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Job Position *</label>
          <input
            className="border rounded w-full p-2 mt-1"
            value={form.position}
            onChange={(e) => handleChange("position", e.target.value)}
            disabled={isGeneratingQuestions}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Years of Experience *</label>
          <input
            className="border rounded w-full p-2 mt-1"
            type="number"
            value={form.experience}
            onChange={(e) => handleChange("experience", e.target.value)}
            disabled={isGeneratingQuestions}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Job Description</label>
          <textarea
            className="border rounded w-full p-2 mt-1 h-28"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            disabled={isGeneratingQuestions}
          ></textarea>
        </div>

        <div>
          <label className="text-sm font-medium">Tech Stack (Optional)</label>
          <input
            className="border rounded w-full p-2 mt-1"
            placeholder="e.g., React, TypeScript, Node.js"
            value={form.techStack}
            onChange={(e) => handleChange("techStack", e.target.value)}
            disabled={isGeneratingQuestions}
          />
        </div>

        <Button onClick={handleSave} disabled={isGeneratingQuestions}>
          {isGeneratingQuestions ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Generating Questions...
            </>
          ) : interviewId ? (
            "Update Interview"
          ) : (
            "Create Interview"
          )}
        </Button>
      </div>

      {/* Webcam Info */}
      <Alert className="bg-yellow-100/50 border-yellow-200 p-4 rounded-lg flex items-start gap-3 -mt-3">
        <Lightbulb className="h-5 w-5 text-yellow-600" />
        <div>
          <AlertTitle className="text-yellow-800 font-semibold">
            Important Information
          </AlertTitle>
          <AlertDescription className="text-sm text-yellow-700 mt-1">
            Please enable your webcam and microphone to start the interview. Questions will be automatically generated when you create or update the interview.
          </AlertDescription>
        </div>
      </Alert>

      {/* Webcam */}
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-full h-[400px] md:w-96 flex flex-col items-center justify-center border p-4 bg-gray-50 rounded-md">
          {isWebCamEnabled ? (
            <WebCam className="w-full h-full rounded-md" />
          ) : (
            <WebcamIcon className="min-w-24 min-h-24 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <Button
          onClick={() => setIsWebCamEnabled(!isWebCamEnabled)}
          disabled={isGeneratingQuestions}
        >
          {isWebCamEnabled ? "Disable Webcam" : "Enable Webcam"}
        </Button>
      </div>
    </div>
  );
};

export default CreateEditPage;
export { CreateEditPage };