<template>
  <div id="app">
    <!-- Экран входа -->
    <div v-if="!currentUser" class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">🔐 QR Access</h1>
          <p class="text-gray-600">Система контроля доступа</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input v-model="loginEmail" type="email"
                   @keyup.enter="login"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="admin@company.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
            <input v-model="loginPassword" type="password"
                   @keyup.enter="login"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="••••••••">
          </div>
          <button @click="login"
                  class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">
            Войти
          </button>
          <div class="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p class="font-medium mb-1">Тестовые аккаунты:</p>
            <p>👨‍💼 Админ: admin@company.com / admin123</p>
            <p>🖥️ Терминал: terminal@company.com / terminal123</p>
            <p>👤 Сотрудник: user@company.com / user123</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Главное приложение -->
    <div v-else>
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
          <div class="flex items-center">
            <img v-if="settings.logo_url" :src="settings.logo_url" class="h-8 mr-2" alt="Logo">
            <div>
              <h1 class="text-2xl font-bold">{{ settings.company_name }}</h1>
              <p class="text-sm text-blue-100">{{ currentUser.name }} ({{ getRoleName(currentUser.role) }})</p>
            </div>
          </div>
          <button @click="logout" class="bg-blue-800 px-4 py-2 rounded hover:bg-blue-900 transition">
            Выход
          </button>
        </div>
      </div>

      <!-- Админ панель -->
      <div v-if="currentUser.role === 'admin'" class="container mx-auto p-4">
        <!-- Навигация -->
        <div class="bg-white rounded-lg shadow mb-6 p-2 flex gap-2 overflow-x-auto">
          <button v-for="tab in tabs" :key="tab.id"
                  @click="activeTab = tab.id"
                  :class="activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                  class="px-4 py-2 rounded transition whitespace-nowrap">
            {{ tab.icon }} {{ tab.name }}
          </button>
        </div>

        <!-- Статистика -->
        <div v-show="activeTab === 'stats'">
          <h2 class="text-2xl font-bold mb-4">📊 Общая статистика</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-6 hover:scale-105 transition">
              <div class="text-3xl font-bold text-blue-600">{{ employees.length }}</div>
              <div class="text-gray-600">Всего сотрудников</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 hover:scale-105 transition">
              <div class="text-3xl font-bold text-green-600">{{ activeEmployees }}</div>
              <div class="text-gray-600">Активные пропуска</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 hover:scale-105 transition">
              <div class="text-3xl font-bold text-red-600">{{ expiredPasses }}</div>
              <div class="text-gray-600">Истёкшие пропуска</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 hover:scale-105 transition">
              <div class="text-3xl font-bold text-purple-600">{{ todayVisits }}</div>
              <div class="text-gray-600">Сканирований за день</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 hover:scale-105 transition">
              <div class="text-3xl font-bold text-indigo-600">{{ weekVisits }}</div>
              <div class="text-gray-600">За неделю</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 hover:scale-105 transition">
              <div class="text-3xl font-bold text-teal-600">{{ guests.length }}</div>
              <div class="text-gray-600">Всего гостей</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 hover:scale-105 transition">
              <div class="text-3xl font-bold text-green-600">{{ activeGuests }}</div>
              <div class="text-gray-600">Активные гости</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6 hover:scale-105 transition">
              <div class="text-3xl font-bold text-orange-600">{{ failedAttempts }}</div>
              <div class="text-gray-600">Ошибочных попыток</div>
            </div>
          </div>
        </div>

        <!-- Сотрудники -->
        <div v-show="activeTab === 'employees'">
          <h2 class="text-2xl font-bold mb-4">👥 Управление сотрудниками</h2>

          <div class="bg-white rounded-lg shadow mb-6">
            <div class="p-6 border-b">
              <h3 class="text-xl font-bold text-gray-800">Добавить сотрудника</h3>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input v-model="newEmployee.name" placeholder="ФИО" class="px-4 py-2 border rounded-lg">
                <input v-model="newEmployee.email" placeholder="Email" class="px-4 py-2 border rounded-lg">
                <input v-model="newEmployee.position" placeholder="Должность" class="px-4 py-2 border rounded-lg">
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <select v-model="newEmployee.department" class="px-4 py-2 border rounded-lg">
                  <option value="">Отдел</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Бухгалтерия">Бухгалтерия</option>
                  <option value="Продажи">Продажи</option>
                  <option value="Логистика">Логистика</option>
                </select>
                <input v-model="newEmployee.valid_until" type="date" class="px-4 py-2 border rounded-lg">
                <button @click="addEmployee"
                        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  ➕ Добавить
                </button>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b">
              <h3 class="text-xl font-bold text-gray-800">Список сотрудников</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ФИО</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Отдел</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                <tr v-for="emp in employees" :key="emp.id">
                  <td class="px-6 py-4">{{ emp.name }}</td>
                  <td class="px-6 py-4">{{ emp.email }}</td>
                  <td class="px-6 py-4">{{ emp.department }}</td>
                  <td class="px-6 py-4">
                      <span v-if="emp.active && isValidDate(emp.valid_until)"
                            class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Активен
                      </span>
                    <span v-else-if="!isValidDate(emp.valid_until)"
                          class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        Истёк
                      </span>
                    <span v-else
                          class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        Заблокирован
                      </span>
                  </td>
                  <td class="px-6 py-4 space-x-2">
                    <button @click="showQR(emp)"
                            class="text-blue-600 hover:text-blue-800">QR</button>
                    <button @click="toggleActive(emp)"
                            class="text-yellow-600 hover:text-yellow-800">
                      {{ emp.active ? 'Блок' : 'Актив' }}
                    </button>
                    <button @click="deleteEmployee(emp.id)"
                            class="text-red-600 hover:text-red-800">Удалить</button>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Гости -->
        <div v-show="activeTab === 'guests'">
          <h2 class="text-2xl font-bold mb-4">🧑 Управление гостями</h2>

          <div class="bg-white rounded-lg shadow mb-6">
            <div class="p-6 border-b">
              <h3 class="text-xl font-bold text-gray-800">Добавить гостя</h3>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input v-model="newGuest.name" placeholder="ФИО гостя" class="px-4 py-2 border rounded-lg">
                <input v-model="newGuest.telegram" placeholder="Telegram @username" class="px-4 py-2 border rounded-lg">
                <input v-model="newGuest.valid_from" type="datetime-local" class="px-4 py-2 border rounded-lg">
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <input v-model="newGuest.valid_to" type="datetime-local" class="px-4 py-2 border rounded-lg">
                <button @click="addGuest"
                        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  ➕ Добавить и отправить
                </button>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b">
              <h3 class="text-xl font-bold text-gray-800">Список гостей</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ФИО</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telegram</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Срок действия</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                <tr v-for="guest in guests" :key="guest.id">
                  <td class="px-6 py-4">{{ guest.name }}</td>
                  <td class="px-6 py-4">{{ guest.telegram }}</td>
                  <td class="px-6 py-4">{{ formatDate(guest.valid_from) }} - {{ formatDate(guest.valid_to) }}</td>
                  <td class="px-6 py-4">
                      <span v-if="isValidGuest(guest)"
                            class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Активен
                      </span>
                    <span v-else
                          class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        Истёк
                      </span>
                  </td>
                  <td class="px-6 py-4 space-x-2">
                    <button @click="showQRGuest(guest)"
                            class="text-blue-600 hover:text-blue-800">QR</button>
                    <button @click="deleteGuest(guest.id)"
                            class="text-red-600 hover:text-red-800">Удалить</button>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Отчёты -->
        <div v-show="activeTab === 'reports'">
          <h2 class="text-2xl font-bold mb-4">🧾 Отчёты</h2>

          <div class="bg-white rounded-lg shadow mb-6">
            <div class="p-6 border-b">
              <h3 class="text-xl font-bold text-gray-800">История посещений</h3>
            </div>
            <div class="p-6">
              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="visit in visits.slice(0, 50)" :key="visit.id"
                     class="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div class="font-medium">{{ visit.employee_name }}</div>
                    <div class="text-sm text-gray-600">{{ visit.department }} • {{ visit.position }} • {{ visit.terminal_type }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm">{{ formatDate(visit.timestamp) }}</div>
                    <div class="text-xs text-gray-600">{{ formatTime(visit.timestamp) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Безопасность -->
        <div v-show="activeTab === 'security'">
          <h2 class="text-2xl font-bold mb-4">🚷 Безопасность</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-3xl font-bold text-red-600">{{ blockedUsers }}</div>
              <div class="text-gray-600">Заблокированных пользователей</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-3xl font-bold text-orange-600">{{ failedAttempts }}</div>
              <div class="text-gray-600">Неудачных попыток входа</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-3xl font-bold text-yellow-600">{{ expiredAttempts }}</div>
              <div class="text-gray-600">Попыток с истекшим QR</div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b">
              <h3 class="text-xl font-bold text-gray-800">Логи безопасности</h3>
            </div>
            <div class="p-6">
              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="log in securityLogs.slice().reverse()" :key="log.id"
                     class="flex justify-between items-center p-3 rounded"
                     :class="log.log_type === 'success' ? 'bg-green-50' : 'bg-red-50'">
                  <div>
                    <div class="font-medium">{{ log.user_name }}</div>
                    <div class="text-sm text-gray-600">{{ log.message }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm">{{ formatDate(log.timestamp) }}</div>
                    <div class="text-xs text-gray-600">{{ formatTime(log.timestamp) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Настройки -->
        <div v-show="activeTab === 'settings'">
          <h2 class="text-2xl font-bold mb-4">⚙️ Настройки системы</h2>
          <div class="bg-white rounded-lg shadow p-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Название компании</label>
                <input v-model="settings.company_name" class="w-full px-4 py-2 border rounded-lg">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">URL логотипа</label>
                <input v-model="settings.logo_url" class="w-full px-4 py-2 border rounded-lg" placeholder="https://example.com/logo.png">
              </div>
              <button @click="saveSettings" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                💾 Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Терминал -->
      <div v-else-if="currentUser.role === 'terminal'" class="mobile-view">
        <div class="p-4 space-y-4">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-center mb-4">🖥️ {{ currentUser.name }}</h2>
            <p class="text-center text-gray-600 mb-6">Тип: {{ currentUser.terminal_type?.toUpperCase() }}</p>

            <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8">
              <div ref="terminalQR" class="flex justify-center mb-4"></div>
              <p class="text-center text-sm text-gray-600">ID терминала: {{ currentUser.terminal_id }}</p>
            </div>

            <div v-if="lastScanResult" class="mt-4 p-4 rounded-lg"
                 :class="lastScanResult.success ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'">
              <div class="text-center">
                <div class="text-4xl mb-2">{{ lastScanResult.success ? '✅' : '❌' }}</div>
                <div class="text-xl font-bold mb-2">{{ lastScanResult.name }}</div>
                <div class="text-gray-700">{{ lastScanResult.message }}</div>
                <div v-if="lastScanResult.department" class="text-sm text-gray-600 mt-2">
                  {{ lastScanResult.department }} • {{ lastScanResult.position }}
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-bold mb-3">📊 Статистика за сегодня</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-2xl font-bold text-green-600">{{ todaySuccessScans }}</div>
                <div class="text-sm text-gray-600">Успешных</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-red-600">{{ todayFailedScans }}</div>
                <div class="text-sm text-gray-600">Отказано</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Личный кабинет сотрудника -->
      <div v-else class="mobile-view">
        <div class="p-4 space-y-4">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="text-center mb-6">
              <h2 class="text-2xl font-bold mb-2">{{ currentUser.name }}</h2>
              <p v-if="currentUser.role === 'employee'" class="text-gray-600">{{ currentUser.position }}</p>
              <p v-if="currentUser.role === 'employee'" class="text-sm text-gray-500">{{ currentUser.department }}</p>
            </div>

            <div class="mb-6">
              <div class="text-center mb-2">
                <span v-if="isValidUser(currentUser)"
                      class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Доступ активен
                </span>
                <span v-else
                      class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  ⚠️ Доступ ограничен
                </span>
              </div>
              <p class="text-sm text-gray-600 text-center mt-2">
                Действителен до: {{ formatDate(currentUser.valid_until) }}
              </p>
            </div>

            <button v-if="!showOwnQR" @click="generateOwnQR" class="w-full bg-green-600 text-white py-2 rounded-lg mb-4 hover:bg-green-700">
              Показать мой QR
            </button>
            <div v-if="showOwnQR" class="bg-gray-50 rounded-lg p-4 mb-4">
              <div ref="ownQR" class="flex justify-center"></div>
            </div>

            <button v-if="!scanning" @click="startScanning"
                    class="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition text-lg font-medium mb-4">
              📱 Отсканировать терминал
            </button>

            <div v-else>
              <div ref="qrReader" class="mb-4 rounded-lg overflow-hidden"></div>
              <button @click="stopScanning"
                      class="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition">
                Остановить
              </button>
            </div>

            <div v-if="scanResult" class="mt-4 p-4 rounded-lg"
                 :class="scanResult.success ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'">
              <div class="text-center">
                <div class="text-4xl mb-2">{{ scanResult.success ? '✅' : '❌' }}</div>
                <div class="text-xl font-bold mb-2">{{ scanResult.message }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-bold mb-3">📅 Ваши посещения</h3>
            <div class="space-y-2">
              <div v-for="visit in userVisits.slice(-10).reverse()" :key="visit.id"
                   class="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div class="text-sm">{{ formatDate(visit.timestamp) }} ({{ visit.terminal_type }})</div>
                <div class="text-sm text-gray-600">{{ formatTime(visit.timestamp) }}</div>
              </div>
              <div v-if="userVisits.length === 0" class="text-center text-gray-500 py-4">
                Нет записей о посещениях
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно с QR-кодом -->
    <div v-if="selectedEmployee || selectedGuest"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
         @click="closeModal">
      <div class="bg-white rounded-lg p-8 max-w-md w-full" @click.stop>
        <h3 class="text-xl font-bold mb-4 text-center">{{ (selectedEmployee || selectedGuest).name }}</h3>
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <p v-if="selectedEmployee" class="text-sm text-gray-600 mb-2">{{ selectedEmployee.position }}</p>
          <p v-if="selectedEmployee" class="text-sm text-gray-600 mb-2">{{ selectedEmployee.department }}</p>
          <p class="text-sm" :class="isValidDate((selectedEmployee || selectedGuest).valid_until || (selectedEmployee || selectedGuest).valid_to) ? 'text-green-600' : 'text-red-600'">
            Действителен до: {{ formatDate((selectedEmployee || selectedGuest).valid_until || (selectedEmployee || selectedGuest).valid_to) }}
          </p>
        </div>
        <div ref="modalQR" class="flex justify-center mb-4"></div>
        <button @click="closeModal"
                class="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700">
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

const API_URL = '/api';


export default {
  name: 'App',
  data() {
    return {
      currentUser: null,
      loginEmail: '',
      loginPassword: '',
      activeTab: 'stats',

      employees: [],
      guests: [],
      visits: [],
      securityLogs: [],
      adminLogs: [],
      notifications: [],
      settings: { company_name: 'ТОО "Secure Access"', logo_url: '' },

      tabs: [
        { id: 'stats', name: 'Статистика', icon: '📊' },
        { id: 'employees', name: 'Сотрудники', icon: '👥' },
        { id: 'guests', name: 'Гости', icon: '🧑' },
        { id: 'reports', name: 'Отчёты', icon: '🧾' },
        { id: 'security', name: 'Безопасность', icon: '🚷' },
        { id: 'settings', name: 'Настройки', icon: '⚙️' }
      ],

      newEmployee: {
        name: '',
        email: '',
        position: '',
        department: '',
        valid_until: '',
        work_start: '09:00',
        work_end: '18:00'
      },

      newGuest: {
        name: '',
        telegram: '',
        valid_from: '',
        valid_to: ''
      },

      selectedEmployee: null,
      selectedGuest: null,
      scanning: false,
      scanResult: null,
      lastScanResult: null,
      showOwnQR: false,
      html5QrCode: null
    };
  },

  computed: {
    activeEmployees() {
      return this.employees.filter(e => e.active && this.isValidDate(e.valid_until)).length;
    },

    expiredPasses() {
      return this.employees.filter(e => !this.isValidDate(e.valid_until)).length;
    },

    blockedUsers() {
      return this.employees.filter(e => !e.active).length;
    },

    todayVisits() {
      const today = new Date().toDateString();
      return this.visits.filter(v => new Date(v.timestamp).toDateString() === today).length;
    },

    weekVisits() {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return this.visits.filter(v => new Date(v.timestamp) >= weekAgo).length;
    },

    failedAttempts() {
      return this.securityLogs.filter(l => l.log_type === 'error').length;
    },

    expiredAttempts() {
      return this.securityLogs.filter(l => l.message.includes('истёк')).length;
    },

    activeGuests() {
      return this.guests.filter(g => this.isValidGuest(g)).length;
    },

    todaySuccessScans() {
      const today = new Date().toDateString();
      return this.securityLogs.filter(l =>
          l.log_type === 'success' && new Date(l.timestamp).toDateString() === today
      ).length;
    },

    todayFailedScans() {
      const today = new Date().toDateString();
      return this.securityLogs.filter(l =>
          l.log_type === 'error' && new Date(l.timestamp).toDateString() === today
      ).length;
    },

    userVisits() {
      if (!this.currentUser) return [];
      return this.visits.filter(v => v.user_id === this.currentUser.id);
    }
  },

  async mounted() {
    // Загрузка данных при монтировании компонента
  },

  methods: {
    async login() {
      try {
        const { data } = await axios.post(`${API_URL}/login`, {
          email: this.loginEmail,
          password: this.loginPassword
        });

        this.currentUser = data.user;
        this.loginEmail = '';
        this.loginPassword = '';

        await this.loadData();

        if (this.currentUser.role === 'terminal') {
          this.$nextTick(() => this.generateTerminalQR());
        }
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка входа');
      }
    },

    logout() {
      if (this.scanning) {
        this.stopScanning();
      }
      this.currentUser = null;
      this.showOwnQR = false;
    },

    async loadData() {
      try {
        if (this.currentUser.role === 'admin') {
          const [emp, guests, visits, secLogs, settings] = await Promise.all([
            axios.get(`${API_URL}/employees`),
            axios.get(`${API_URL}/guests`),
            axios.get(`${API_URL}/visits`),
            axios.get(`${API_URL}/security-logs`),
            axios.get(`${API_URL}/settings`)
          ]);

          this.employees = emp.data;
          this.guests = guests.data;
          this.visits = visits.data;
          this.securityLogs = secLogs.data;
          this.settings = settings.data;
        } else if (this.currentUser.role === 'terminal') {
          const [secLogs] = await Promise.all([
            axios.get(`${API_URL}/security-logs`)
          ]);
          this.securityLogs = secLogs.data;
        } else if (this.currentUser.role === 'employee') {
          const [visits] = await Promise.all([
            axios.get(`${API_URL}/visits`)
          ]);
          this.visits = visits.data;
        }
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
      }
    },

    async addEmployee() {
      if (!this.newEmployee.name || !this.newEmployee.email || !this.newEmployee.valid_until) {
        alert('Заполните все обязательные поля');
        return;
      }

      try {
        await axios.post(`${API_URL}/employees`, this.newEmployee);
        await this.loadData();
        this.newEmployee = { name: '', email: '', position: '', department: '', valid_until: '', work_start: '09:00', work_end: '18:00' };
        alert('Сотрудник добавлен!');
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка добавления');
      }
    },

    async deleteEmployee(id) {
      if (!confirm('Удалить сотрудника?')) return;

      try {
        await axios.delete(`${API_URL}/employees/${id}`);
        await this.loadData();
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка удаления');
      }
    },

    async toggleActive(emp) {
      try {
        await axios.patch(`${API_URL}/employees/${emp.id}/toggle`);
        await this.loadData();
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка изменения статуса');
      }
    },

    async addGuest() {
      if (!this.newGuest.name || !this.newGuest.valid_to) {
        alert('Заполните все обязательные поля');
        return;
      }

      try {
        await axios.post(`${API_URL}/guests`, this.newGuest);
        await this.loadData();

        if (this.newGuest.telegram) {
          alert(`Отправлено в Telegram ${this.newGuest.telegram}: Ваш QR-пропуск готов!`);
        }

        this.newGuest = { name: '', telegram: '', valid_from: '', valid_to: '' };
        alert('Гость добавлен!');
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка добавления');
      }
    },

    async deleteGuest(id) {
      if (!confirm('Удалить гостя?')) return;

      try {
        await axios.delete(`${API_URL}/guests/${id}`);
        await this.loadData();
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка удаления');
      }
    },

    async saveSettings() {
      try {
        await axios.put(`${API_URL}/settings`, this.settings);
        alert('Настройки сохранены!');
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка сохранения');
      }
    },

    showQR(emp) {
      this.selectedEmployee = emp;
      this.selectedGuest = null;
      this.$nextTick(() => {
        this.generateQR(emp, 'employee');
      });
    },

    showQRGuest(guest) {
      this.selectedGuest = guest;
      this.selectedEmployee = null;
      this.$nextTick(() => {
        this.generateQR(guest, 'guest');
      });
    },

    async generateQR(data, type) {
      const qrData = JSON.stringify({
        type: type,
        id: data.id,
        name: data.name,
        ...(type === 'employee' ? {
          email: data.email,
          department: data.department,
          position: data.position,
          valid_until: data.valid_until
        } : {
          telegram: data.telegram,
          valid_from: data.valid_from,
          valid_to: data.valid_to
        }),
        active: data.active
      });

      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrData, { width: 200 });

      const container = this.$refs.modalQR;
      container.innerHTML = '';
      container.appendChild(canvas);
    },

    async generateTerminalQR() {
      const qrData = JSON.stringify({
        type: 'terminal',
        terminalId: this.currentUser.terminal_id,
        terminalType: this.currentUser.terminal_type,
        timestamp: Date.now()
      });

      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrData, { width: 250 });

      const container = this.$refs.terminalQR;
      container.innerHTML = '';
      container.appendChild(canvas);

      // Обновлять QR каждые 30 секунд для безопасности
      setInterval(() => {
        this.generateTerminalQR();
      }, 30000);
    },

    async generateOwnQR() {
      this.showOwnQR = true;

      await this.$nextTick();

      const qrData = JSON.stringify({
        type: this.currentUser.role,
        id: this.currentUser.id,
        name: this.currentUser.name,
        ...(this.currentUser.role === 'employee' ? {
          email: this.currentUser.email,
          department: this.currentUser.department,
          position: this.currentUser.position,
          valid_until: this.currentUser.valid_until
        } : {
          telegram: this.currentUser.telegram,
          valid_from: this.currentUser.valid_from,
          valid_to: this.currentUser.valid_to
        }),
        active: this.currentUser.active
      });

      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrData, { width: 200 });

      const container = this.$refs.ownQR;
      container.innerHTML = '';
      container.appendChild(canvas);
    },

    async startScanning() {
      this.scanning = true;
      this.scanResult = null;

      await this.$nextTick();

      try {
        // Создаем элемент для QR-ридера если его нет
        let readerElement = document.getElementById('qr-reader');
        if (!readerElement) {
          readerElement = document.createElement('div');
          readerElement.id = 'qr-reader';
          this.$refs.qrReader.appendChild(readerElement);
        }

        this.html5QrCode = new Html5Qrcode("qr-reader");

        // Получаем список камер
        const cameras = await Html5Qrcode.getCameras();

        if (cameras && cameras.length > 0) {
          // Используем первую доступную камеру (обычно это веб-камера ноутбука)
          const cameraId = cameras[0].id;

          await this.html5QrCode.start(
              cameraId,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
              },
              (decodedText) => {
                // QR-код отсканирован успешно
                this.processQRCode(decodedText);
              },
              (errorMessage) => {
                // Ошибки сканирования (игнорируем, они постоянные)
              }
          );

          console.log('✅ Камера запущена успешно!');
        } else {
          throw new Error('Камера не найдена');
        }
      } catch (err) {
        console.error('Ошибка запуска камеры:', err);
        alert('Не удалось запустить камеру. Проверьте:\n1. Разрешения браузера на доступ к камере\n2. Камера не используется другим приложением\n3. Используйте HTTPS или localhost');
        this.scanning = false;
      }
    },

    stopScanning() {
      if (this.html5QrCode) {
        this.html5QrCode.stop().then(() => {
          this.scanning = false;
          this.html5QrCode = null;
        });
      }
    },

    async processQRCode(qrData) {
      try {
        const data = JSON.parse(qrData);

        if (data.type === 'terminal' && (this.currentUser.role === 'employee' || this.currentUser.role === 'guest')) {
          // Сотрудник сканирует терминал
          const response = await axios.post(`${API_URL}/scan`, {
            qrData: JSON.stringify({
              type: this.currentUser.role,
              id: this.currentUser.id,
              name: this.currentUser.name,
              active: this.currentUser.active,
              ...(this.currentUser.role === 'employee' ? {
                valid_until: this.currentUser.valid_until
              } : {
                valid_from: this.currentUser.valid_from,
                valid_to: this.currentUser.valid_to
              })
            }),
            terminalType: data.terminalType
          });

          this.scanResult = response.data;

          setTimeout(() => {
            this.scanResult = null;
            this.stopScanning();
            this.loadData();
          }, 3000);
        }
      } catch (err) {
        this.scanResult = { success: false, message: err.response?.data?.message || 'Ошибка сканирования' };
      }
    },

    closeModal() {
      this.selectedEmployee = null;
      this.selectedGuest = null;
    },

    getRoleName(role) {
      const names = {
        admin: 'Администратор',
        terminal: 'Терминал',
        employee: 'Сотрудник',
        guest: 'Гость'
      };
      return names[role] || role;
    },

    isValidDate(dateString) {
      const date = new Date(dateString);
      return date >= new Date();
    },

    isValidGuest(guest) {
      const now = new Date();
      const from = new Date(guest.valid_from);
      const to = new Date(guest.valid_to);
      return now >= from && now <= to && guest.active;
    },

    isValidUser(user) {
      if (user.valid_from && user.valid_to) {
        return this.isValidGuest(user);
      }
      return this.isValidDate(user.valid_until) && user.active;
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU');
    },

    formatTime(date) {
      return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.mobile-view {
  max-width: 480px;
  margin: 0 auto;
}

#qr-reader {
  width: 100%;
  border: 2px solid #3b82f6;
  border-radius: 8px;
}
</style>
