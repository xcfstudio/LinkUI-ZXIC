<!-- 顶部内容 -->
<template>
  <div class="header-content">
    <div class="logo">
      <img src="/pic/logo.png" alt="logo" />
    </div>
    <!--menu登陆后才能显示 -->
    <div class="nav-bar">
      <div class="menu-pc" v-if="procStore.loginfo === 'ok'">
        <ul>
          <li
            v-for="item in menuList"
            :key="item.name"
            :class="{ 'menu-active': $route.path.startsWith(item.url.replace('#', '')) }"
          >
            <a :href="item.url">{{ item.name }}</a>
          </li>
        </ul>
      </div>
      <div
        ref="menuMobileRef"
        class="menu-mobile"
        :class="{
          'menu-mobile-visible': !uiStore.isCollapseMobileMenu && procStore.loginfo === 'ok',
        }"
      >
        <ul>
          <li
            v-for="item in menuList"
            :key="item.name"
            :class="{ 'menu-active': $route.path.startsWith(item.url) }"
            @click="uiStore.toggleCollapseMobileMenu"
          >
            <a :href="item.url">{{ item.name }}</a>
          </li>

          <!-- 移动端显示 -->
          <li class="menu-divider"></li>
          <li class="menu-action" @click="showChangePwdDialog = true">修改密码</li>
          <li class="menu-action menu-action-danger" @click="handleLogout">退出登录</li>
        </ul>
      </div>
      <div class="btn-group" v-if="true">
        <div
          class="switch-dark"
          style="cursor: pointer; color: var(--text-primary); display: flex; margin-right: 10px"
        >
          <span
            @click="onSwitchDarkMode"
            class="iconfont"
            style="font-size: 22px"
            v-show="dark === '0'"
            >&#xe713;</span
          >
          <span
            @click="onSwitchDarkMode"
            class="iconfont"
            style="font-size: 20px"
            v-show="dark === '1'"
            >&#xe655;</span
          >
        </div>

        <div class="btns" v-if="procStore.loginfo === 'ok'">
          <!-- 修改密码和登出按钮需要登陆后显示 -->
          <LButton
            @click="showChangePwdDialog = true"
            class="lbutton"
            type="plain"
            style="margin-right: 10px"
            >修改密码</LButton
          >
          <LButton @click="handleLogout" class="lbutton" type="primary"
            ><span class="iconfont" style="font-size: 12px">&#xe774;</span>
          </LButton>
        </div>

        <!-- 移动端菜单按钮 -->
        <!-- &#xe704 -->
        <div
          class="menu-btn"
          @click="uiStore.toggleCollapseMobileMenu"
          v-if="$route.path !== '/login'"
        >
          <i class="iconfont" style="font-size: 22px">&#xe704;</i>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <LDialog
      v-model:visible="showChangePwdDialog"
      title="修改密码"
      :show-footer="false"
      @close="clearPasswordForm"
    >
      <div class="change-pwd-form">
        <div class="form-item">
          <label class="form-label">当前密码 <span class="required">*</span></label>
          <LInput v-model="oldPassword" type="password" placeholder="请输入当前密码" />
        </div>
        <div class="form-item">
          <label class="form-label">新密码 <span class="required">*</span></label>
          <LInput v-model="newPassword" type="password" placeholder="请输入新密码" />
        </div>
        <div class="form-item">
          <label class="form-label">确认新密码 <span class="required">*</span></label>
          <LInput v-model="confirmPassword" type="password" placeholder="请再次输入新密码" />
        </div>
        <div class="form-actions">
          <LButton type="primary" @click="handleChangePassword">确认修改</LButton>
        </div>
      </div>
    </LDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import LButton from './LButton.vue'
import LInput from './LInput.vue'
import LDialog from './LDialog.vue'
import { logout, changePassword } from '@/api/basic.api.ts'
import { useUiStore, useProcStore } from '@/stores/index.ts'
import { useRouter } from 'vue-router'
import { LMessage } from '@/components'

const props = defineProps({
  dark: {
    type: String,
    default: '0',
  },
})

const emit = defineEmits(['switchDarkMode'])

// 切换主题模式
const onSwitchDarkMode = () => {
  emit('switchDarkMode')
}

const uiStore = useUiStore()
const procStore = useProcStore()
const router = useRouter()

// 移动端菜单容器引用
const menuMobileRef = ref<HTMLElement | null>(null)

// 关闭移动端菜单
const closeMobileMenu = () => {
  uiStore.closeMobileMenu()
}

// 点击外部区域关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const menuBtn = document.querySelector('.menu-btn')
  if (
    menuMobileRef.value &&
    !menuMobileRef.value.contains(target) &&
    menuBtn &&
    !menuBtn.contains(target)
  ) {
    closeMobileMenu()
  }
}

// 触摸滑动关闭菜单
const handleTouchStart = ref(0)
const handleTouchMove = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (!touch) return
  const touchEnd = touch.clientY
  if (Math.abs(touchEnd - handleTouchStart.value) > 50) {
    closeMobileMenu()
  }
}

// 路由切换时关闭菜单
const handleRouteChange = () => {
  closeMobileMenu()
}

// 窗口resize时关闭菜单
const handleResize = () => {
  if (window.innerWidth >= 950) {
    closeMobileMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0]
    if (touch) {
      handleTouchStart.value = touch.clientY
    }
  })
  document.addEventListener('touchmove', handleTouchMove)
  router.afterEach(handleRouteChange)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('touchstart', (e) => {
    const touch = e.touches[0]
    if (touch) {
      handleTouchStart.value = touch.clientY
    }
  })
  document.removeEventListener('touchmove', handleTouchMove)
  router.afterEach(handleRouteChange)
  window.removeEventListener('resize', handleResize)
})

const menuList = ref([
  {
    name: '设备信息',
    url: '#/deviceInfo',
  },
  {
    name: '高级设置',
    url: '#/advancedSettings',
  },
  {
    name: 'AT Master',
    url: `http://${window.location.hostname}:9090/at.html`,
  },
])

// 修改密码相关
const showChangePwdDialog = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const clearPasswordForm = () => {
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

const handleChangePassword = async () => {
  if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
    LMessage.error('请填写所有密码字段')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    LMessage.error('两次输入的新密码不一致')
    return
  }

  try {
    const response = await changePassword(btoa(oldPassword.value), btoa(newPassword.value))

    if (response.data.result === 'success') {
      LMessage.success('密码修改成功，请重新登录')
      showChangePwdDialog.value = false
      clearPasswordForm()

      await logout()
      procStore.loginfo = ''
      location.href = '#/login'
    } else {
      LMessage.error('密码修改失败')
    }
  } catch (error) {
    LMessage.error('密码修改失败')
  }
}

const handleLogout = async () => {
  // 登出逻辑
  logout()
  // 更新登录状态
  procStore.loginfo = ''

  location.href = '#/login'
}
</script>

<style scoped lang="scss">
.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;

  @media screen and (max-width: 750px) {
    justify-content: space-between;
  }

  .logo {
    margin-right: 20px;

    img {
      height: 30px;

      // 响应式：移动端logo缩小
      @media screen and (max-width: 768px) {
        height: 24px;
      }
    }
  }

  .nav-bar {
    display: flex;
    align-items: center;
    justify-content: center;

    .menu-pc {
      display: flex;
      align-items: center;

      @media screen and (max-width: 750px) {
        display: none;
      }

      ul {
        display: flex;
        align-items: center;
        margin: 0 50px;

        li {
          margin-right: 20px;
          color: var(--text-secondary);
          cursor: pointer;
        }
      }
    }

    .menu-mobile {
      position: absolute;
      top: 100%;
      right: 0;
      width: 200px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition:
        opacity 0.3s ease,
        transform 0.3s ease,
        visibility 0.3s ease;
      z-index: 100;

      &-visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      ul {
        margin: 0;
        padding: 8px 0;
        list-style: none;

        li {
          padding: 12px 16px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background-color 0.2s ease;

          &:hover {
            background-color: var(--bg-secondary);
          }

          a {
            color: inherit;
            text-decoration: none;
          }
        }

        .menu-divider {
          height: 1px;
          background: var(--border-color);
          margin: 8px 0;
          padding: 0;
          cursor: default;

          &:hover {
            background: var(--border-color);
          }
        }

        .menu-action {
          color: var(--text-secondary);

          &-danger {
            color: var(--danger);

            &:hover {
              background-color: rgba(var(--danger), 0.1);
            }
          }
        }
      }

      @media screen and (min-width: 750px) {
        display: none;
      }
    }

    .btn-group {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;

      .btns {
        @media screen and (max-width: 750px) {
          display: none;
        }
      }

      .menu-btn {
        margin-left: 5px;
        cursor: pointer;
        color: var(--text-secondary);
        transition: color 0.2s ease;

        &:hover {
          color: var(--primary);
        }

        @media screen and (min-width: 750px) {
          display: none;
        }
      }
    }
  }

  .menu-active {
    color: var(--primary) !important;
    font-weight: bold;
  }
}

.change-pwd-form {
  padding: 10px 0;

  .form-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;

    &:last-of-type {
      margin-bottom: 20px;
    }
  }

  .form-label {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }

  .required {
    color: var(--danger-500, #ef4444);
    margin-left: 4px;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border-color, #e5e7eb);
  }
}
</style>