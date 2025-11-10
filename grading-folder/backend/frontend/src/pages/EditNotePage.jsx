/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { ArrowLeftIcon, LoaderIcon, SaveIcon } from "lucide-react";

const EditNotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await api.get(`/notes/${id}`);
        setNote(res.data);
      } catch (error) {
        console.error("Error fetching note:", error);
        toast.error("Failed to load note");
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const handleUpdate = async () => {
    if (!note.title.trim() || !note.content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/notes/${id}`, note);
      toast.success("Note updated successfully ✅");
      navigate(`/notes/${id}`);
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <LoaderIcon className="animate-spin size-10" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-base-200 flex items-center justify-center"
    >
      <div className="w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <Link to={`/notes/${id}`} className="btn btn-ghost gap-2">
            <ArrowLeftIcon className="h-5 w-5" /> Back
          </Link>
        </div>

        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="card bg-base-100 shadow-xl border border-base-300"
        >
          <div className="card-body space-y-5">
            <h2 className="text-2xl font-bold text-primary">Edit Your Note 📝</h2>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Title</span>
              </label>
              <input
                type="text"
                placeholder="Enter note title"
                className="input input-bordered focus:ring focus:ring-primary/30"
                value={note.title}
                onChange={(e) => setNote({ ...note, title: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Content</span>
              </label>
              <textarea
                placeholder="Update your note content..."
                className="textarea textarea-bordered h-40 focus:ring focus:ring-primary/30"
                value={note.content}
                onChange={(e) => setNote({ ...note, content: e.target.value })}
              />
            </div>

            <div className="card-actions justify-end">
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="btn btn-primary gap-2"
              >
                {saving ? (
                  <>
                    <LoaderIcon className="animate-spin h-5 w-5" /> Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-5 w-5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EditNotePage;
