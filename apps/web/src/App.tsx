import { Button, Card, CardHeader, CardContent } from "@flashcard/ui";

export function App() {
  return (
    <div className="app">
      <h1>Flashcard App</h1>
      <Card>
        <CardHeader>Welcome</CardHeader>
        <CardContent>
          <p>Start building your flashcard collection!</p>
          <Button>Get Started</Button>
        </CardContent>
      </Card>
    </div>
  );
}
