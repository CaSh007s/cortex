export type Source = {
  page: number;
  source: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[]; // Only assistant messages have sources
  isLoading?: boolean; // For UI loading state
};