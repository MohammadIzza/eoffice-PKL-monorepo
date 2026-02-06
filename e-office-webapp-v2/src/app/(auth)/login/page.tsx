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
import { DevLoginModal } from "./DevLoginModal";

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

  const handleDevLogin = (email: string) => {
    form.setValue("email", email);
    form.setValue("password", "password1234");
    form.handleSubmit(onSubmit)();
  };

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage(null);
    
    try {
      await login(data.email, data.password);
      router.push("/dashboard"); 
    } catch (error: any) {
      setErrorMessage("Email atau password yang Anda masukkan salah.");
    }
  };

  const backgroundImageUrl = "/ap_undip.jpg"; 

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="hidden lg:block relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('${backgroundImageUrl}')` 
          }}
        ></div>
        
        {/* Dark Overlay Layers */}
        <div className="absolute inset-0 bg-slate-950/60"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-transparent to-slate-900/80"></div>
        
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20 shadow-lg">
               <Image 
                 src="/Undip.png" 
                 alt="Logo Undip" 
                 width={48} 
                 height={48} 
                 className="object-contain"
               />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">E-Office FSM</span>
              <span className="text-xs text-slate-300 font-medium tracking-wider uppercase">Universitas Diponegoro</span>
            </div>
          </div>

          <div className="space-y-6 max-w-lg mb-12">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl drop-shadow-md">
              Sistem Informasi <br/> <span className="text-indigo-400">Persuratan Digital</span>
            </h1>
            <p className="text-lg text-slate-200 leading-relaxed font-light">
              Platform terintegrasi untuk pengelolaan administrasi akademik dan kemahasiswaan Fakultas Sains dan Matematika.
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400/80 border-t border-white/10 pt-6">
            <span>&copy; {new Date().getFullYear()} FSM Undip</span>
            <span className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors">Bantuan</a>
              <a href="#" className="hover:text-white transition-colors">Privasi</a>
            </span>
          </div>
        </div>
      </div>

      {/* LOGIN FORM */}
      <div className="flex items-center justify-center p-4 min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-[440px] space-y-8">
          
          {/* Mobile Logo */}
          <div className="flex flex-col items-center justify-center lg:hidden mb-8 space-y-2">
               <Image 
                 src="/Undip.png" 
                 alt="Logo Undip" 
                 width={64} 
                 height={64} 
                 className="mb-2"
               />
               <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">E-Office FSM</h2>
          </div>

          <Card className="border-0 shadow-2xl sm:border sm:border-slate-200/60 dark:bg-slate-900/50 dark:border-slate-800 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center pb-8 pt-10">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Selamat Datang Kembali</CardTitle>
            <CardDescription className="text-base text-slate-500 dark:text-slate-400">
              Silakan masuk dengan akun Undip / SSO Anda
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                
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
                  className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 rounded-lg hover:translate-y-[1px]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk ke Portal"
                  )}
                </Button>

                {process.env.NODE_ENV === "development" && (
                    <div className="pt-2">
                         <DevLoginModal onLogin={handleDevLogin} isLoading={isLoading} />
                    </div>
                )}
              </form>
            </Form>
          </CardContent>
          <div className="px-8 pb-8 text-center text-xs text-muted-foreground border-t pt-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl">
             Belum punya akun? <a href="#" className="underline hover:text-indigo-600 transition-colors">Hubungi Administrator</a>
          </div>
        </Card>
        
        <div className="mt-8 text-center text-xs text-slate-400 lg:hidden">
            &copy; {new Date().getFullYear()} FSM Undip
        </div>
        </div>
      </div>
    </div>
  );
}