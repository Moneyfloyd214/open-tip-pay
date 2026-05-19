import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, KYCStatus } from "../backend";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export default function OnboardingPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const saveProfile = useSaveCallerUserProfile();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo must be less than 5MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter an email");
      return;
    }

    try {
      let photoBlob: ExternalBlob | undefined;

      if (photoFile) {
        const arrayBuffer = await photoFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        photoBlob = ExternalBlob.fromBytes(uint8Array);
      }

      await saveProfile.mutateAsync({
        username: username.trim(),
        email: email.trim(),
        bio: bio.trim(),
        photo: photoBlob,
        walletAddress: undefined,
        isFirstWalletConnection: true,
        phoneNumber: undefined,
        isVerified: false,
        currentStatus: undefined,
        kycStatus: KYCStatus.notSubmitted,
        kycSubmissionTimestamp: undefined,
        kycProviderReference: undefined,
      });

      toast.success("Profile created successfully!");
    } catch (error) {
      console.error("Profile creation error:", error);
      toast.error("Failed to create profile. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-navy via-navy-light to-teal p-4">
      <div className="mx-auto w-full max-w-md space-y-6 py-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Welcome to Open Tip Pay
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Set up your profile to get started
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white p-6 shadow-xl"
        >
          {/* Photo Upload */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-teal">
              {photoPreview ? (
                <AvatarImage src={photoPreview} alt="Profile" />
              ) : (
                <AvatarFallback className="bg-navy-light text-white">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              )}
            </Avatar>
            <Label htmlFor="photo" className="cursor-pointer">
              <div className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark">
                <Upload className="h-4 w-4" />
                Upload Photo
              </div>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </Label>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-navy">
              Username *
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="text-navy border-navy-light focus:border-teal"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-navy">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-navy border-navy-light focus:border-teal"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-navy">
              Bio (Optional)
            </Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="text-navy border-navy-light focus:border-teal resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={saveProfile.isPending}
            className="w-full bg-teal hover:bg-teal-dark text-white font-semibold"
            size="lg"
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Profile...
              </>
            ) : (
              "Create Profile"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
