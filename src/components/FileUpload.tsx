import {useCallback} from 'react';
import {useDropzone} from 'react-dropzone';
import {FileText, Sparkles, Upload} from 'lucide-react';

interface FileUploadProps {

  onFileUpload: (file: File) => void;

  isLoading: boolean;

}



export function FileUpload({ onFileUpload, isLoading }: FileUploadProps) {

  const onDrop = useCallback(async (acceptedFiles: File[]) => {

    const file = acceptedFiles[0];

    if (file) {

      onFileUpload(file);

    }

  }, [onFileUpload]);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
        },
        multiple: false,
        disabled: isLoading,
    });

    return (
        <div className="w-full max-w-2xl mx-auto slide-up">
            <div
                {...getRootProps()}
                className={`upload-zone cursor-pointer ${isDragActive ? 'upload-zone-active' : ''} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div
                            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            {isDragActive ? (
                                <Sparkles className="w-10 h-10 text-primary animate-pulse"/>
                            ) : (
                                <Upload className="w-10 h-10 text-primary"/>
                            )}
                        </div>
                        <div
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <FileText className="w-4 h-4 text-muted-foreground"/>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">
                            {isDragActive ? 'Drop your chat here!' : 'Upload WhatsApp Export'}
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-md">
                            Drag and drop your WhatsApp chat export (.txt) or click to browse.
                            All analysis happens locally in your browser.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-positive animate-pulse"/>
                        <span>100% Private • No data leaves your device</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>
                    <span className="font-medium">How to export:</span> WhatsApp → Chat → More → Export chat → Without
                    media
                </p>
            </div>
        </div>
    );
}
