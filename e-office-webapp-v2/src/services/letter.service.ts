// Letter service - CRUD operations for letters
export const letterService = {
  // Mahasiswa: Submit surat
  submitLetter: async (data: any) => {
    // TODO: POST /letter/submit
  },
  
  // Mahasiswa: Get my letters
  getMyLetters: async () => {
    // TODO: GET /letter/my
  },
  
  // Mahasiswa: Get letter detail
  getLetterById: async (id: string) => {
    // TODO: GET /letter/:id
  },
  
  // Mahasiswa: Resubmit after revision
  resubmitLetter: async (id: string, data: any) => {
    // TODO: POST /letter/:id/resubmit
  },
  
  // Mahasiswa: Cancel letter
  cancelLetter: async (id: string) => {
    // TODO: POST /letter/:id/cancel
  },
  
  // Mahasiswa: Delete draft/rejected letter
  deleteLetter: async (id: string) => {
    // TODO: DELETE /letter/:id
  }
};
