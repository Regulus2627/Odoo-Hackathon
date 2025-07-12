import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const allUsersContainer = document.getElementById('all-users');

    onAuthStateChanged(auth, user => {
        if (user) {
            // User is signed in.
            loadUsers();
        } else {
            // No user is signed in.
            window.location.href = 'login.html';
        }
    });

    async function loadUsers() {
        if (!allUsersContainer) return;

        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            allUsersContainer.innerHTML = ''; // Clear existing content

            querySnapshot.forEach(userDoc => {
                const userData = userDoc.data();
                const userCard = document.createElement('div');
                userCard.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300';

                const banButtonDisabled = userData.banned ? 'disabled' : '';
                const banButtonText = userData.banned ? 'Banned' : 'Ban User';

                userCard.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900">${userData.name || 'N/A'}</h3>
                            <p class="text-gray-600">${userData.email}</p>
                        </div>
                        <span class="text-sm font-medium ${userData.banned ? 'text-red-500 bg-red-100' : 'text-green-500 bg-green-100'} px-2 py-1 rounded-full">
                            ${userData.banned ? 'Banned' : 'Active'}
                        </span>
                    </div>
                    <button class="mt-4 w-full ${userData.banned ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white py-2 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-400" data-uid="${userDoc.id}" ${banButtonDisabled}>
                        ${banButtonText}
                    </button>
                `;

                allUsersContainer.appendChild(userCard);
            });

            // Add event listeners to ban buttons
            allUsersContainer.querySelectorAll('button[data-uid]').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const userId = e.target.dataset.uid;
                    if (userId) {
                        await banUser(userId);
                    }
                });
            });

        } catch (error) {
            console.error("Error loading users:", error);
            allUsersContainer.innerHTML = '<p class="text-red-500">Error loading users. Please try again later.</p>';
        }
    }

    async function banUser(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                banned: true
            });

            // Visually update the button
            const button = allUsersContainer.querySelector(`button[data-uid="${userId}"]`);
            if (button) {
                button.disabled = true;
                button.textContent = 'Banned';
                button.classList.remove('bg-red-500', 'hover:bg-red-600');
                button.classList.add('bg-gray-400', 'cursor-not-allowed');

                // Update the status badge
                const statusBadge = button.parentElement.querySelector('span');
                if (statusBadge) {
                    statusBadge.textContent = 'Banned';
                    statusBadge.classList.remove('text-green-500', 'bg-green-100');
                    statusBadge.classList.add('text-red-500', 'bg-red-100');
                }
            }
        } catch (error) {
            console.error("Error banning user:", error);
            alert("Failed to ban user. Please check the console for more details.");
        }
    }
});
