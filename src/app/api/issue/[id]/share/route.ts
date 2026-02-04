import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  is_public: z.boolean()
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseRouteClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(await request.json());
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('issues')
    .update({ is_public: payload.is_public })
    .eq('id', params.id)
    .eq('user_id', auth.user.id)
    .select('id,is_public')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Unable to update share status.' }, { status: 500 });
  }

  if (payload.is_public) {
    const admin = createSupabaseAdminClient();
    await admin.from('events').insert({
      user_id: auth.user.id,
      issue_id: params.id,
      type: 'issue_shared',
      metadata: { is_public: true }
    });
  }

  return NextResponse.json(data);
}
