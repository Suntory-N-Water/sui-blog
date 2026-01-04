import { Separator } from '@/components/ui/separator';

export function TransitionSection() {
  return (
    <div className='bg-muted relative'>
      <div className='flex justify-center py-8'>
        <div className='flex flex-col items-center opacity-70'>
          <Separator
            orientation='vertical'
            className='w-0.5 h-20 border-dashed mb-2 border-primary border-l-2'
          />
          <div className='w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-14 border-t-primary'></div>
        </div>
      </div>
    </div>
  );
}
