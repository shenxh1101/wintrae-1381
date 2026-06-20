export default defineAppConfig({
  pages: [
    'pages/dashboard/index',
    'pages/products/index',
    'pages/bookings/index',
    'pages/verify/index',
    'pages/notify/index',
    'pages/product-edit/index',
    'pages/booking-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4CAF50',
    navigationBarTitleText: '农夫市集摊主端',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#4CAF50',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/dashboard/index',
        text: '看板'
      },
      {
        pagePath: 'pages/products/index',
        text: '商品'
      },
      {
        pagePath: 'pages/bookings/index',
        text: '预订'
      },
      {
        pagePath: 'pages/verify/index',
        text: '核销'
      },
      {
        pagePath: 'pages/notify/index',
        text: '通知'
      }
    ]
  }
})
