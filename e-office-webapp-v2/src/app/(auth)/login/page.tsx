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
import { withBasePath } from "@/lib/navigation";
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
      window.location.href = withBasePath("/dashboard"); 
    } catch (error: any) {
      setErrorMessage("Email atau password yang Anda masukkan salah.");
    }
  };

  const backgroundImageUrl = withBasePath("/ACINTYA.jpeg"); 

  const handleSSOLogin = () => {
    // Architectural Requirement: Direct redirection to External SSO
    window.location.href = "https://apps-fsm.undip.ac.id/sso";
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="hidden lg:block relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('${backgroundImageUrl}')` 
          }}
        ></div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-slate-950/70"></div>
        
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                <img 
                  src={withBasePath("/Undip.png")} 
                  alt="Logo Undip" 
                  width={40} 
                  height={40} 
                  className="object-contain"
                />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">E-Office FSM</span>
              <span className="text-xs text-slate-300">Universitas Diponegoro</span>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Sistem Informasi <br/> <span className="text-blue-400">Persuratan Digital</span>
            </h1>
            <p className="text-base text-slate-300">
              Platform terintegrasi untuk pengelolaan administrasi akademik dan kemahasiswaan Fakultas Sains dan Matematika.
            </p>
          </div>

          <div className="text-xs text-slate-400 border-t border-white/10 pt-5">
            <span>&copy; {new Date().getFullYear()} FSM Undip. All rights reserved.</span>
          </div>
        </div>
      </div>

      {/* LOGIN FORM */}
      <div className="flex items-center justify-center p-6 min-h-screen bg-slate-50">
        <div className="w-full max-w-[360px]">
          
          {/* Mobile Logo */}
          <div className="flex flex-col items-center justify-center lg:hidden mb-6">
                <img 
                  src={withBasePath("/Undip.png")} 
                  alt="Logo Undip" 
                  width={40} 
                  height={40} 
                  className="mb-1.5"
                />
               <h2 className="text-base font-bold text-slate-900">E-Office FSM</h2>
          </div>

          <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="space-y-0.5 text-center pb-4 pt-6">
            <CardTitle className="text-lg font-bold text-slate-900">Selamat Datang Kembali</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Silakan masuk dengan akun sistem atau SSO Anda
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-5 pb-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                
                {/* Input Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Email Terdaftar</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <Input 
                            placeholder="Masukkan email" 
                            className="pl-8 h-9 border-slate-200 text-sm" 
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
                      <FormLabel className="text-xs font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Masukkan password" 
                            className="pl-8 pr-9 h-9 border-slate-200 text-sm" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-2.5 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMessage && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <AlertTitle className="text-xs">Gagal Masuk</AlertTitle>
                    <AlertDescription className="text-xs">
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-9 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition-colors" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </Button>

               
                 <div className="pt-1 text-center">
                   <DevLoginModal onLogin={handleDevLogin} isLoading={isLoading} />
                 </div>
               
              </form>
            </Form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-medium">
                <span className="bg-white px-2 text-slate-400">Atau</span>
              </div>
            </div>

            <Button 
              onClick={handleSSOLogin}
              type="button"
              className="w-full h-9 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2" 
            >
              <Lock className="w-3.5 h-3.5" />
              Login dengan SSO FSM UNDIP
            </Button>
          </CardContent>
          <div className="px-5 pb-5 text-center text-[11px] text-slate-500 border-t pt-4">
             Belum punya akun? <a href="#" className="text-blue-600 hover:underline">Hubungi Administrator</a>
          </div>
        </Card>
        
        <div className="mt-5 text-center text-[11px] text-slate-400 lg:hidden">
            &copy; {new Date().getFullYear()} FSM Undip
        </div>
        </div>
      </div>
    </div>
  );
}
