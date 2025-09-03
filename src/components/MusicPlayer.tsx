import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Upload,
  Trash2,
  Music
} from 'lucide-react';
import { MusicTrack } from '@/types/music';
import { useLanguage } from '@/contexts/LanguageContext';

interface MusicPlayerProps {
  tracks: MusicTrack[];
  onAddTrack: (track: MusicTrack) => void;
  onDeleteTrack: (trackId: string) => void;
  onPlayStateChange?: (isPlaying: boolean, title: string) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  tracks,
  onAddTrack,
  onDeleteTrack,
  onPlayStateChange
}) => {
  const { language } = useLanguage();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([75]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => handleNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume[0] / 100;
    }
  }, [volume]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error(language === 'ar' ? 'الرجاء اختيار ملف صوتي' : 'Please select an audio file');
      return;
    }

    const url = URL.createObjectURL(file);
    const track: MusicTrack = {
      id: Date.now().toString(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      file,
      url,
      createdAt: new Date()
    };

    onAddTrack(track);
    toast.success(language === 'ar' ? 'تم إضافة المقطع الموسيقي' : 'Track added successfully');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const newIsPlaying = !isPlaying;
    if (newIsPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
    setIsPlaying(newIsPlaying);
    onPlayStateChange?.(newIsPlaying, currentTrack.title);
  };

  const handlePrevious = () => {
    if (tracks.length === 0) return;
    const newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
    setCurrentTrackIndex(newIndex);
    setIsPlaying(false);
    onPlayStateChange?.(false, tracks[newIndex]?.title || '');
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    const newIndex = currentTrackIndex < tracks.length - 1 ? currentTrackIndex + 1 : 0;
    setCurrentTrackIndex(newIndex);
    setIsPlaying(false);
    onPlayStateChange?.(false, tracks[newIndex]?.title || '');
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(false);
  };

  const handleDeleteTrack = (trackId: string) => {
    onDeleteTrack(trackId);
    if (currentTrackIndex >= tracks.length - 1) {
      setCurrentTrackIndex(Math.max(0, tracks.length - 2));
    }
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl">
            <Upload className="h-5 w-5" />
            {language === 'ar' ? 'إضافة موسيقى' : 'Add Music'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="music-upload" className="rtl">
              {language === 'ar' ? 'اختر ملف صوتي' : 'Select audio file'}
            </Label>
            <Input
              id="music-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
          </div>
        </CardContent>
      </Card>

      {/* Player Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl">
            <Music className="h-5 w-5" />
            {language === 'ar' ? 'مشغل الموسيقى' : 'Music Player'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentTrack && (
            <>
              <audio
                ref={audioRef}
                src={currentTrack.url}
                onPlay={() => {
                  setIsPlaying(true);
                  onPlayStateChange?.(true, currentTrack.title);
                }}
                onPause={() => {
                  setIsPlaying(false); 
                  onPlayStateChange?.(false, currentTrack.title);
                }}
              />
              
              <div className="text-center space-y-2">
                <h3 className="font-semibold rtl">{currentTrack.title}</h3>
                {currentTrack.artist && (
                  <p className="text-sm text-muted-foreground rtl">{currentTrack.artist}</p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  max={duration || 100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  disabled={tracks.length === 0}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                <Button
                  size="icon"
                  onClick={handlePlay}
                  disabled={!currentTrack}
                  className="h-12 w-12"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={tracks.length === 0}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4" />
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-8">
                  {volume[0]}%
                </span>
              </div>
            </>
          )}

          {!currentTrack && (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="rtl">
                {language === 'ar' ? 'لا توجد مقاطع موسيقية' : 'No music tracks'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Playlist */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl">
            {language === 'ar' ? 'قائمة التشغيل' : 'Playlist'} ({tracks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tracks.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 rtl">
              {language === 'ar' ? 'قائمة التشغيل فارغة' : 'Playlist is empty'}
            </p>
          ) : (
            <div className="space-y-2">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    index === currentTrackIndex
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleTrackSelect(index)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      {index === currentTrackIndex && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate rtl">{track.title}</p>
                      {track.artist && (
                        <p className="text-sm text-muted-foreground truncate rtl">
                          {track.artist}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrack(track.id);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};