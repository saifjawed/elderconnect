import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import api from "@/services/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const getInitials = (user) => {
  if (!user) return "U";
  const first = user.firstName?.[0] || user.name?.[0] || "";
  const last = user.lastName?.[0] || "";
  return (first + last).toUpperCase() || "U";
};

const AvatarUploader = ({
  user,
  onUserUpdated,
  onError,
  onSuccess,
  className,
}) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || "");

  useEffect(() => {
    setPreviewUrl(user?.avatar || "");
  }, [user?.avatar]);

  useEffect(() => {
    if (!previewUrl?.startsWith("blob:")) return undefined;
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const initials = useMemo(() => getInitials(user), [user]);

  const setMessage = (type, message) => {
    if (type === "error") {
      onError?.(message);
      if (message) onSuccess?.(null);
      return;
    }
    onSuccess?.(message);
    if (message) onError?.(null);
  };

  const resetPicker = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSelectFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setMessage("error", "Please choose a JPG, PNG, WEBP, or GIF image.");
      resetPicker();
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setMessage("error", "Please choose an image smaller than 5MB.");
      resetPicker();
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);
    setMessage("error", null);
    setMessage("success", null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onUserUpdated?.(res.data);
      setMessage("success", "Profile picture updated.");
    } catch (err) {
      setPreviewUrl(user?.avatar || "");
      setMessage("error", err.response?.data?.message || "Failed to upload profile picture.");
    } finally {
      setIsUploading(false);
      resetPicker();
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setMessage("error", null);
    setMessage("success", null);

    try {
      const res = await api.delete("/users/me/avatar");
      onUserUpdated?.(res.data);
      setPreviewUrl("");
      setMessage("success", "Profile picture removed.");
    } catch (err) {
      setMessage("error", err.response?.data?.message || "Failed to remove profile picture.");
    } finally {
      setIsRemoving(false);
      resetPicker();
    }
  };

  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center", className)}>
      <Avatar className="h-24 w-24 border border-gray-200 bg-white shadow-sm">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile avatar preview"
            className="h-full w-full object-cover"
            onError={() => setPreviewUrl("")}
          />
        ) : (
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Profile Picture</h2>
          <p className="text-sm text-gray-600">
            Upload a square-friendly photo. JPG, PNG, WEBP, or GIF up to 5MB.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleSelectFile}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || isRemoving}
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {previewUrl ? "Change Photo" : "Upload Photo"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemove}
            disabled={!user?.avatar || isUploading || isRemoving}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {isRemoving ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AvatarUploader;
