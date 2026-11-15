"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { GHOST_BUTTON, INPUT, SECONDARY_BUTTON } from "@/components/ui/button-styles";
import { FormError } from "@/components/ui/FormError";
import { GENERIC_ERROR_MESSAGE, readApiErrorMessage } from "@/lib/api-error";
import { COMMENT_MAX_LENGTH } from "@/lib/comment-schemas";
import type { TaskComment } from "@/lib/comments";

type CommentThreadProps = {
  taskId: string;
  taskTitle: string;
  currentUserId: string;
  /** The project OWNER may delete any comment. */
  canModerate: boolean;
};

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function CommentThread({ taskId, taskTitle, currentUserId, canModerate }: CommentThreadProps) {
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const boxId = useId();
  const commentsUrl = `/api/v1/tasks/${encodeURIComponent(taskId)}/comments`;

  // Comments load when the thread opens; collaboration is refresh-based, so reopening fetches the latest.
  useEffect(() => {
    let cancelled = false;
    fetch(commentsUrl)
      .then(async (response) => {
        if (cancelled) {
          return;
        }
        if (response.ok) {
          const body: { comments: TaskComment[] } = await response.json();
          setComments(body.comments);
        } else {
          setError(await readApiErrorMessage(response));
        }
      })
      .catch(() => !cancelled && setError(GENERIC_ERROR_MESSAGE));
    return () => {
      cancelled = true;
    };
  }, [commentsUrl]);

  async function handlePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(commentsUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: String(new FormData(form).get("body") ?? "") }),
      });
      if (response.ok) {
        const body: { comment: TaskComment } = await response.json();
        setComments((current) => [...(current ?? []), body.comment]);
        form.reset();
      } else {
        setError(await readApiErrorMessage(response));
      }
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(commentId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/v1/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" });
      if (response.ok) {
        setComments((current) => (current ?? []).filter((comment) => comment.id !== commentId));
      } else {
        setError(await readApiErrorMessage(response));
      }
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    }
  }

  return (
    <section aria-label={`Comments on ${taskTitle}`} className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3">
      <FormError message={error} />
      {comments === null ? (
        error ? null : <p className="text-xs text-zinc-600">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-zinc-600">No comments yet</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg bg-zinc-50 px-3 py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="text-xs font-semibold text-zinc-900">{comment.author.name}</p>
                <time dateTime={comment.createdAt} className="text-xs text-zinc-600">
                  {TIME_FORMAT.format(new Date(comment.createdAt))}
                </time>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap break-words text-zinc-900">{comment.body}</p>
              {comment.author.userId === currentUserId || canModerate ? (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  aria-label={`Delete comment by ${comment.author.name}`}
                  className={`${GHOST_BUTTON} mt-1 -ml-2.5 text-xs hover:bg-red-50 hover:text-red-800`}
                >
                  Delete
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form aria-label={`Comment on ${taskTitle}`} onSubmit={handlePost} className="flex flex-col gap-2">
        <label htmlFor={boxId} className="text-xs font-medium text-zinc-900">
          Add a comment
        </label>
        <textarea id={boxId} name="body" rows={2} maxLength={COMMENT_MAX_LENGTH} className={`${INPUT} resize-y`} />
        <div>
          <button type="submit" disabled={pending} className={SECONDARY_BUTTON}>
            Post comment
          </button>
        </div>
      </form>
    </section>
  );
}
