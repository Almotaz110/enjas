import { useState } from 'react';
import { CustomReward, UserStats } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Gift, Trophy, Star, Coffee, Book, Music, GamepadIcon, ShoppingBag, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CustomRewardsProps {
  rewards: CustomReward[];
  userStats: UserStats;
  onAddReward: (reward: CustomReward) => void;
  onClaimReward: (rewardId: string) => void;
  onDeleteReward: (rewardId: string) => void;
}

const iconOptions = [
  { name: 'Gift', icon: Gift },
  { name: 'Trophy', icon: Trophy },
  { name: 'Star', icon: Star },
  { name: 'Coffee', icon: Coffee },
  { name: 'Book', icon: Book },
  { name: 'Music', icon: Music },
  { name: 'GamepadIcon', icon: GamepadIcon },
  { name: 'ShoppingBag', icon: ShoppingBag },
];

export const CustomRewards = ({ rewards, userStats, onAddReward, onClaimReward, onDeleteReward }: CustomRewardsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Gift',
    pointsRequired: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || formData.pointsRequired <= 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newReward: CustomReward = {
      id: uuidv4(),
      title: formData.title,
      description: formData.description,
      icon: formData.icon,
      pointsRequired: formData.pointsRequired,
      isClaimable: userStats.experience >= formData.pointsRequired,
      isClaimed: false,
      createdAt: new Date(),
    };

    onAddReward(newReward);
    setFormData({ title: '', description: '', icon: 'Gift', pointsRequired: 0 });
    setIsDialogOpen(false);
    toast.success('تم إضافة المكافأة بنجاح!');
  };

  const handleClaim = (reward: CustomReward) => {
    if (reward.isClaimable && !reward.isClaimed) {
      onClaimReward(reward.id);
      toast.success(`تم الحصول على مكافأة: ${reward.title}! 🎉`);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.name === iconName);
    return iconOption ? iconOption.icon : Gift;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold rtl">المكافآت المخصصة</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rtl">
              <Plus className="h-4 w-4 ml-2" />
              إضافة مكافأة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rtl">
            <DialogHeader>
              <DialogTitle>إضافة مكافأة جديدة</DialogTitle>
              <DialogDescription>
                أضف مكافأة جديدة لتحفيز نفسك على إنجاز المهام
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان المكافأة</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: مشاهدة فيلم"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف المكافأة..."
                />
              </div>
              
              <div>
                <Label htmlFor="pointsRequired">النقاط المطلوبة</Label>
                <Input
                  id="pointsRequired"
                  type="number"
                  min="1"
                  value={formData.pointsRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, pointsRequired: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
              
              <div>
                <Label>الأيقونة</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {iconOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <Button
                        key={option.name}
                        type="button"
                        variant={formData.icon === option.name ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, icon: option.name }))}
                        className="h-12"
                      >
                        <IconComponent className="h-5 w-5" />
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  إضافة المكافأة
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const IconComponent = getIconComponent(reward.icon);
          const canClaim = reward.isClaimable && !reward.isClaimed;
          const isClaimed = reward.isClaimed;
          
          return (
            <Card 
              key={reward.id} 
              className={`relative overflow-hidden ${
                isClaimed 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : canClaim 
                    ? 'bg-accent/10 border-accent/20' 
                    : 'bg-muted'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${
                      isClaimed 
                        ? 'bg-green-100 dark:bg-green-900/50' 
                        : canClaim 
                          ? 'bg-accent/20' 
                          : 'bg-muted'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        isClaimed 
                          ? 'text-green-600 dark:text-green-400' 
                          : canClaim 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-gray-400'
                      }`} />
                    </div>
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {isClaimed && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                        مُحققة
                      </Badge>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف مكافأة "{reward.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteReward(reward.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {reward.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {reward.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="rtl">
                    {reward.pointsRequired} نقطة
                  </Badge>
                  <span className="text-sm text-gray-500">
                    لديك: {userStats.experience} نقطة
                  </span>
                </div>
                
                {!isClaimed && (
                  <Button
                    onClick={() => handleClaim(reward)}
                    disabled={!canClaim}
                    className={`w-full rtl ${
                      canClaim 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {canClaim ? 'احصل على المكافأة' : 'تحتاج نقاط أكثر'}
                  </Button>
                )}
                
                {isClaimed && reward.claimedAt && (
                  <p className="text-xs text-green-600 dark:text-green-400 text-center">
                    تم الحصول عليها في {new Date(reward.claimedAt).toLocaleDateString('ar-SA')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {rewards.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">لا توجد مكافآت مخصصة</h3>
            <p className="text-gray-400 mb-4">أضف مكافآت مخصصة لتحفيز نفسك على إنجاز المزيد!</p>
          </div>
        )}
      </div>
    </div>
  );
};