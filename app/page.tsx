import { Button } from '@/components/ui/button'
import { Gift, Sparkles, Lock, Share2 } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Wishlist</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
          Create your perfect
          <br />
          <span className="text-primary">birthday wishlist</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
          Share what you really want for your birthday. Add your own links or let our AI find the best options from top retailers. Friends and family can claim gifts anonymously.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">Create Your Wishlist</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">AI-Powered Search</h3>
              <p className="mt-2 text-muted-foreground">
                Describe what you want and our AI finds the best options from Amazon, Target, and more.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Share2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Easy Sharing</h3>
              <p className="mt-2 text-muted-foreground">
                Get a simple link to share with friends and family. No account needed for them to view.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Anonymous Claims</h3>
              <p className="mt-2 text-muted-foreground">
                Gift givers can claim items anonymously. No double-buying, surprises preserved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-muted-foreground">
            Create your wishlist in minutes and share it with everyone.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/auth/sign-up">Create Your Wishlist</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built with care for birthday wishes everywhere.</p>
        </div>
      </footer>
    </div>
  )
}
