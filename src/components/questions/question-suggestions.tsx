import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, User as UserIcon, Building2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SuggestionData = {
  id: string;
  content: string;
  createdAt: Date;
  faculty?: {
    name: string;
    department: string | null;
  };
};

export function QuestionSuggestions({
  suggestions,
  isAdmin = false,
}: {
  suggestions: SuggestionData[];
  isAdmin?: boolean;
}) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Student Suggestions ({suggestions.length})
      </h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="flex flex-col h-full hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
            <CardHeader className="pb-3 flex-1 border-b border-border/40">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-slate-900 hover:bg-slate-800 text-slate-50 border-slate-900 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 shadow-sm text-xs font-semibold px-2 py-0.5 rounded-md">
                  Anonymous Student
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(suggestion.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="bg-muted/20 pt-5 pb-5 mt-auto rounded-b-xl border-t border-border/40">
              <div className="relative">
                <span className="absolute -top-4 -left-2 text-5xl text-muted-foreground/20 font-serif leading-none">"</span>
                <p className="text-sm text-foreground/90 leading-relaxed font-medium pl-4 z-10 relative">
                  {suggestion.content}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
