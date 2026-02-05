"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/api/useAuth";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { login, isLoading } = useAuth();
  const router = useRouter(); 

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage(null);
    
    try {
      await login(data.email, data.password);
      router.push("/dashboard"); 
    } catch (error: any) {
      setErrorMessage("Email atau password yang Anda masukkan salah.");
    }
  };

  const backgroundImageUrl = "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1986&auto=format&fit=crop"; 

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="hidden bg-slate-900 lg:block relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ 
            backgroundImage: `url('${backgroundImageUrl}')` 
          }}
        ></div>
        
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
               <Image 
                 src="/Undip.png" 
                 alt="Logo Undip" 
                 width={40} 
                 height={40} 
                 className="object-contain"
               />
            </div>
            <span className="text-lg font-bold tracking-tight">E-Office FSM</span>
          </div>

          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
              Sistem Informasi <br/> Persuratan Digital
            </h1>
            <p className="text-lg text-slate-300">
              Fakultas Sains dan Matematika <br/> Universitas Diponegoro
            </p>
          </div>

          <div className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} FSM Undip. All rights reserved.
          </div>
        </div>
      </div>

      {/* LOGIN FORM */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-100 dark:bg-slate-950">
        <Card className="mx-auto w-full max-w-[500px] py-12 shadow-lg border-muted/40 bg-white dark:bg-slate-900">

          <CardHeader className="space-y-1 text-center pb-8">
             <div className="flex justify-center lg:hidden mb-2">
               <Image 
                 src="/Undip.png" 
                 alt="Logo Undip" 
                 width={50} 
                 height={50} 
               />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Selamat Datang</CardTitle>
            <CardDescription className="text-base mt-2">
              Masuk untuk mengakses dashboard E-Office Anda
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                
                {/* Input Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Undip / SSO</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Masukkan email Anda" 
                            className="pl-9 h-11 bg-background" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Input Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Masukkan password Anda" 
                            className="pl-9 pr-9 h-11 bg-background" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Gagal Masuk</AlertTitle>
                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full mt-2 h-11 text-base bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 transition-all duration-300 shadow-md hover:shadow-lg" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}