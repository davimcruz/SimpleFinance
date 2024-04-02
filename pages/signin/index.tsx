"use client"
import { FormEvent, useState } from "react"
import { useRouter } from "next/router"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"


export default function Login() {

  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Fazendo login com email:', email, 'e senha:', password);
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 md:items-center justify-center">
      <Card>
        <CardTitle>Faça seu Login</CardTitle>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password">Senha:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit">Entrar</button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
