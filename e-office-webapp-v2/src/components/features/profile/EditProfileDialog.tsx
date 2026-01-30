'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Pastikan komponen ini ada, atau pakai Input biasa
import { Pencil, Loader2 } from 'lucide-react';
import { authService } from '@/services';
import { useAuthStore } from '@/stores';
import { toast } from 'sonner';
import type { User } from '@/types';

const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  noHp: z.string().optional(),
  alamat: z.string().optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
  user: User;
}

export function EditProfileDialog({ user }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const { checkSession } = useAuthStore();
  
  const isMahasiswa = !!user.mahasiswa;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      noHp: user.mahasiswa?.noHp || user.pegawai?.noHp || '',
      alamat: user.mahasiswa?.alamat || '',
      tempatLahir: user.mahasiswa?.tempatLahir || '',
      tanggalLahir: user.mahasiswa?.tanggalLahir 
        ? new Date(user.mahasiswa.tanggalLahir).toISOString().split('T')[0] 
        : '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await authService.updateProfile(data);
      toast.success('Profil berhasil diperbarui');
      await checkSession();
      setOpen(false);
    } catch (error) {
      toast.error('Gagal memperbarui profil');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Profil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>
            Perbarui informasi profil Anda di sini. Klik simpan setelah selesai.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noHp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor HP / WhatsApp</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="08..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isMahasiswa && (
              <>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="tempatLahir"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tempat Lahir</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="tanggalLahir"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tanggal Lahir</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <FormField
                  control={form.control}
                  name="alamat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Domisili</FormLabel>
                      <FormControl>
                        <Input {...field} /> 
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter className="mt-6">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}