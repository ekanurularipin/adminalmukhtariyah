import { uniqueId } from 'lodash'

export interface ChildItem {
  id?: number | string
  name?: string
  icon?: string
  children?: ChildItem[]
  item?: unknown
  url?: string
  color?: string
  disabled?: boolean
  subtitle?: string
  badge?: boolean
  badgeType?: string
  isPro?: boolean
}

export interface MenuItem {
  heading?: string
  name?: string
  icon?: string
  id?: number | string
  to?: string
  items?: MenuItem[]
  children?: ChildItem[]
  url?: string
  disabled?: boolean
  subtitle?: string
  badgeType?: string
  badge?: boolean
  isPro?: boolean
}

const SidebarContent: MenuItem[] = [
  // ==================== NON-PRO SECTIONS ====================
  {
    heading: 'Home',
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/',
        isPro: false,
      },
    ],
  },

  {
    heading: 'pages',
    children: [
      {
        name: 'Tables',
        icon: 'solar:server-linear',
        id: uniqueId(),
        url: '/utilities/table',
      },
      {
        name: 'Form',
        icon: 'solar:document-add-linear',
        id: uniqueId(),
        url: '/utilities/form',
      },
      {
        id: uniqueId(),
        name: 'User Profile',
        icon: 'solar:user-circle-linear',
        url: '/user-profile',
        isPro: false,
      },
    ],
  },
  {
    heading: 'Website',
    children: [
      
      {
        name: 'Blogs',
        id: uniqueId(),
        icon: 'solar:sort-by-alphabet-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Website Sekolah',
            url: 'https://mtsal-mukhtariyah.vercel.app/',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Website Yayasan',
            url: 'https://ponpesal-mukhtariyah.vercel.app/',
            isPro: false,
          },
        ],
      },
    ],
  },


   {
    heading: 'TABLES',
    children: [
      {
        name: 'Data Ponpes',
        id: uniqueId(),
        icon: 'solar:tablet-linear',
        children: [
          {
            name: 'Data Santri',
            id: uniqueId(),
            url: '/apps/ponpes/data-santri',
            isPro: false,
          },
          {
            name: 'Kobong & Aset',
            id: uniqueId(),
            url: '/apps/ponpes/kobong',
            isPro: false,
          },
          {
            name: 'Jadwal Mengaji',
            id: uniqueId(),
            url: '/apps/ponpes/jadwal/mengaji',
            isPro: false,
          },
          {
            name: 'Jadwal Piket',
            id: uniqueId(),
            url: '/apps/ponpes/jadwal/piket',
            isPro: false,
          },
          {
            name: 'Pelanggaran',
            id: uniqueId(),
            url: '/apps/ponpes/pelanggaran',
            isPro: false,
          },
          {
            name: 'Data Ustadz',
            id: uniqueId(),
            url: '/apps/ponpes/Ustadz',
            isPro: false,
          },
          {
            name: 'Izin Pulang',
            id: uniqueId(),
            url: '/apps/ponpes/izin-pulang',
            isPro: false,
          },
        ],
      },
      {
        name: 'Data Sekolah',
        id: uniqueId(),
        icon: 'solar:bedside-table-3-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Data Siswa',
            url: '/apps/sekolah/data-siswa',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Data Guru',
            url: '/apps/sekolah/data-guru',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Mata Pelajaran',
            url: '/apps/sekolah/mata-pelajaran',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Jadwal Pelajaran',
            url: '/apps/sekolah/jadwal-pelajaran',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Absensi',
            url: '/apps/sekolah/absensi',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Kirim Pesan',
            url: '/apps/sekolah/kirim',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Data Nilai',
            url: '/',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Koneksi',
            url: '/apps/sekolah/koneksi',
            isPro: false,
          },
        ],
      },
    ],
  },

  // {
  //   heading: 'Auth',
  //   children: [
  //     {
  //       name: 'Log Out',
  //       id: uniqueId(),
  //       icon: 'solar:login-2-linear',
  //       children: [
  //         {
  //           id: uniqueId(),
  //           name: 'Log Out',
  //           url: '/auth/login',
  //           isPro: false,
  //         },
  //       ],
  //     },
      
  //   ],
  // },
]

export default SidebarContent
