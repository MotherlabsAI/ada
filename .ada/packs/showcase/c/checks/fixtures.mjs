// Sample datasets for the showcase pack.
// `clean` satisfies every invariant. `withDefect` plants the exact failure the
// spec promises Ada will catch: an overlapping booking for the same staff member.

const staff = [
  { id: 'staff_amy', name: 'Amy' },
  { id: 'staff_lee', name: 'Lee' },
];
const clients = [
  { id: 'cl_jo', name: 'Jo' },
  { id: 'cl_max', name: 'Max' },
  { id: 'cl_sam', name: 'Sam' },
];
const services = [
  { id: 'sv_sleeve', name: 'Sleeve session', minutes: 120 },
  { id: 'sv_touchup', name: 'Touch-up', minutes: 30 },
  { id: 'sv_consult', name: 'Consultation', minutes: 30 },
];

export const clean = {
  staff,
  clients,
  services,
  bookings: [
    { id: 'bk_1', staffId: 'staff_amy', clientId: 'cl_jo', serviceId: 'sv_sleeve', startsAt: '2026-06-10T14:00:00Z', endsAt: '2026-06-10T16:00:00Z', status: 'active' },
    { id: 'bk_3', staffId: 'staff_lee', clientId: 'cl_sam', serviceId: 'sv_consult', startsAt: '2026-06-10T14:00:00Z', endsAt: '2026-06-10T14:30:00Z', status: 'active' },
  ],
  payments: [
    { id: 'pay_1', bookingId: 'bk_1', amountCents: 15000, kind: 'deposit' },
    { id: 'pay_2', bookingId: 'bk_3', amountCents: 5000, kind: 'deposit' },
  ],
};

export const withDefect = {
  staff,
  clients,
  services,
  bookings: [
    ...clean.bookings,
    // bk_2 overlaps bk_1 on staff_amy (15:00-15:30 inside 14:00-16:00): a double-booking.
    { id: 'bk_2', staffId: 'staff_amy', clientId: 'cl_max', serviceId: 'sv_touchup', startsAt: '2026-06-10T15:00:00Z', endsAt: '2026-06-10T15:30:00Z', status: 'active' },
  ],
  payments: clean.payments,
};
