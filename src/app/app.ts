import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Spending {
  id: number;
  name: string;
  amount: number;
}

interface Enjoyment {
  id: number;
  name: string;
  amount: number;
  emoji: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  monthlyBudget: number | null = null;

  spendings: Spending[] = [];
  enjoyments: Enjoyment[] = [];

  newSpendingName = '';
  newSpendingAmount: number | null = null;

  newEnjoymentName = '';
  newEnjoymentAmount: number | null = null;
  newEnjoymentEmoji = '🍮';

  selectedEnjoyment: Enjoyment | null = null;

  today = new Date();

  ngOnInit(): void {
    this.loadData();
  }

  get totalSpent(): number {
    return this.spendings.reduce(
      (total, item) => total + item.amount,
      0
    );
  }

  get hasBudget(): boolean {
    return this.monthlyBudget !== null &&
           this.monthlyBudget > 0;
  }

  get remainingMoney(): number {
    if (!this.hasBudget) return 0;

    return Math.max(
      0,
      this.monthlyBudget! - this.totalSpent
    );
  }

  get daysInMonth(): number {
    return new Date(
      this.today.getFullYear(),
      this.today.getMonth() + 1,
      0
    ).getDate();
  }

  get currentDay(): number {
    return this.today.getDate();
  }

  get averageDailySpending(): number {
    if (this.totalSpent === 0) return 0;

    return Math.round(
      this.totalSpent / this.currentDay
    );
  }

  get predictedMonthlySpending(): number {
    if (this.totalSpent === 0) return 0;

    return Math.round(
      this.averageDailySpending * this.daysInMonth
    );
  }

  get predictedRemainingMoney(): number {
    if (!this.hasBudget) return 0;

    return Math.max(
      0,
      this.monthlyBudget! - this.predictedMonthlySpending
    );
  }

  get selectedCount(): number {
    if (
      !this.selectedEnjoyment ||
      this.selectedEnjoyment.amount <= 0 ||
      !this.hasBudget
    ) {
      return 0;
    }

    return Math.floor(
      this.remainingMoney /
      this.selectedEnjoyment.amount
    );
  }

  setBudget(): void {
    if (
      this.monthlyBudget !== null &&
      this.monthlyBudget < 0
    ) {
      this.monthlyBudget = 0;
    }

    this.saveData();
  }

  addSpending(): void {
    if (
      !this.newSpendingName.trim() ||
      this.newSpendingAmount === null ||
      this.newSpendingAmount <= 0
    ) {
      return;
    }

    this.spendings.push({
      id: Date.now(),
      name: this.newSpendingName.trim(),
      amount: this.newSpendingAmount
    });

    this.newSpendingName = '';
    this.newSpendingAmount = null;

    this.saveData();
  }

  removeSpending(id: number): void {
    const spending = this.spendings.find(
      item => item.id === id
    );

    if (!spending) return;

    const confirmed = window.confirm(
      `「${spending.name}　¥${this.formatMoney(spending.amount)}」を削除しますか？`
    );

    if (!confirmed) return;

    this.spendings = this.spendings.filter(
      item => item.id !== id
    );

    this.saveData();
  }

  addEnjoyment(): void {
    if (
      !this.newEnjoymentName.trim() ||
      this.newEnjoymentAmount === null ||
      this.newEnjoymentAmount <= 0
    ) {
      return;
    }

    this.enjoyments.push({
      id: Date.now(),
      name: this.newEnjoymentName.trim(),
      amount: this.newEnjoymentAmount,
      emoji: this.newEnjoymentEmoji || '🍮'
    });

    this.newEnjoymentName = '';
    this.newEnjoymentAmount = null;
    this.newEnjoymentEmoji = '🍮';

    this.saveData();
  }

  removeEnjoyment(id: number): void {
    this.enjoyments = this.enjoyments.filter(
      item => item.id !== id
    );

    if (this.selectedEnjoyment?.id === id) {
      this.selectedEnjoyment = null;
    }

    this.saveData();
  }

  selectEnjoyment(item: Enjoyment): void {
    this.selectedEnjoyment = item;
  }

  closeDetail(): void {
    this.selectedEnjoyment = null;
  }

  floor(value: number): number {
    return Math.floor(value);
  }

  formatMoney(amount: number): string {
    return amount.toLocaleString('ja-JP');
  }

  private getCurrentMonthKey(): string {
    const year = this.today.getFullYear();
    const month = String(
      this.today.getMonth() + 1
    ).padStart(2, '0');

    return `${year}-${month}`;
  }

  private saveData(): void {
    localStorage.setItem(
      'purin-budget',
      this.monthlyBudget === null
        ? ''
        : JSON.stringify(this.monthlyBudget)
    );

    localStorage.setItem(
      'purin-spendings',
      JSON.stringify(this.spendings)
    );

    localStorage.setItem(
      'purin-enjoyments',
      JSON.stringify(this.enjoyments)
    );

    localStorage.setItem(
      'purin-month',
      this.getCurrentMonthKey()
    );
  }

  private loadData(): void {
    const savedMonth = localStorage.getItem(
      'purin-month'
    );

    const currentMonth = this.getCurrentMonthKey();

    const spendings = localStorage.getItem(
      'purin-spendings'
    );

    const enjoyments = localStorage.getItem(
      'purin-enjoyments'
    );

    if (savedMonth !== currentMonth) {
      /*
       * 月が変わったら、
       * 前月の支出と今月使えるお金をリセットする。
       */
      this.monthlyBudget = null;
      this.spendings = [];

      if (enjoyments) {
        this.enjoyments = JSON.parse(enjoyments);
      }

      this.saveData();
      return;
    }

    const budget = localStorage.getItem(
      'purin-budget'
    );

    if (budget) {
      this.monthlyBudget = Number(budget);
    } else {
      this.monthlyBudget = null;
    }

    if (spendings) {
      this.spendings = JSON.parse(spendings);
    }

    if (enjoyments) {
      this.enjoyments = JSON.parse(enjoyments);
    }
  }
}